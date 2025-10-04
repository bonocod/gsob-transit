const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const logger = require('../config/logger');

// Show booking page
exports.getBooking = async (req, res) => {
  try {
    const destinations = await Destination.find();
    const studentId = req.session.studentId;
    const existingBooking = await Booking.findOne({ student: studentId });

    if (existingBooking && existingBooking.status === 'paid') {
      return res.render('booking', {
        csrfToken: req.csrfToken(),
        destinations: [],
        existingBooking,
        errorMessage: null
      });
    }

    res.render('booking', {
      csrfToken: req.csrfToken(),
      destinations,
      existingBooking: null,
      errorMessage: null
    });
  } catch (err) {
    logger.error('Error fetching booking page', { error: err.message });
    res.render('booking', {
      errorMessage: 'Failed to load booking page',
      csrfToken: req.csrfToken(),
      destinations: [],
      existingBooking: null
    });
  }
};

// Create and pay for a booking
exports.createBooking = async (req, res) => {
  const { destination: destId, phoneNumber } = req.body;
  const studentId = req.session.studentId;

  try {
    // Prevent duplicate paid bookings
    const existingBooking = await Booking.findOne({ student: studentId });
    if (existingBooking && existingBooking.status === 'paid') {
      throw new Error('You already have a paid booking.');
    }

    // Validate inputs
    if (!destId || !phoneNumber) {
      throw new Error('Destination and phone number are required.');
    }

    // Verify destination exists
    const destinationDoc = await Destination.findById(destId);
    if (!destinationDoc) {
      throw new Error('Selected destination not found.');
    }

    const price = destinationDoc.price;

    // Create a pending booking in MongoDB
    const booking = new Booking({
      student: studentId,
      destination: destinationDoc.name,
      phoneNumber,
      status: 'pending',
      price
    });
    await booking.save();

    // Generate payment reference and get token
    const refId = uuidv4();
    const token = await getMoMoToken();

    // Initiate MoMo payment
    await requestToPay(token, price, phoneNumber, refId);

    // Poll transaction status (max 60s)
    let status = 'PENDING';
    let attempts = 0;
    while (status === 'PENDING' && attempts < 12) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await getTransactionStatus(token, refId);
      attempts++;
    }

    if (status === 'SUCCESSFUL') {
      booking.status = 'paid';
      await booking.save();
      logger.info('Booking paid via MoMo', { studentId, refId });
      res.redirect('/ticket-success');
    } else {
      await Booking.deleteOne({ _id: booking._id });
      throw new Error('Payment failed or timed out.');
    }

  } catch (err) {
    logger.error('Error creating booking', { error: err.message, studentId });
    res.redirect(`/ticket-failure?message=${encodeURIComponent(err.message || 'Failed to create booking')}`);
  }
};

// ======================
// Helper Functions
// ======================

async function getMoMoToken() {
  try {
    const auth = Buffer.from(`${process.env.MOMO_API_USER_ID}:${process.env.MOMO_API_KEY}`).toString('base64');
    const { data } = await axios.post(
      'https://sandbox.momodeveloper.mtn.com/collection/token/',
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY
        }
      }
    );
    return data.access_token;
  } catch (error) {
    console.error('Failed to get MoMo token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with MoMo API.');
  }
}

async function requestToPay(token, amount, phone, refId) {
  try {
    const sanitizedPhone = phone.replace(/^\+/, ''); // remove +
    await axios.post(
      'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
      {
        amount: amount.toString(),
        currency: 'EUR', // Sandbox uses EUR
        externalId: refId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: sanitizedPhone
        },
        payerMessage: 'GSOB Transit ticket payment',
        payeeNote: 'Ticket booking'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': refId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY
        }
      }
    );
  } catch (error) {
    console.error('Failed to request MoMo payment:', error.response?.data || error.message);
    throw new Error('MoMo payment request failed.');
  }
}

async function getTransactionStatus(token, refId) {
  try {
    const { data } = await axios.get(
      `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${refId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY
        }
      }
    );
    return data.status;
  } catch (error) {
    console.error('Failed to get transaction status:', error.response?.data || error.message);
    return 'FAILED';
  }
}
