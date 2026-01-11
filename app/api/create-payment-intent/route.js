// app/api/create-payment-intent/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

// MongoDB Connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Payment Schema
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'inr'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  billNumber: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Get the Payment model
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse the request body
    const body = await request.json();
    const { amount, currency = 'inr', billNumber } = body;

    // Validate the amount
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ['card'],
      metadata: {
        billNumber: billNumber
      }
    });

    // Save payment details to MongoDB
    const payment = new Payment({
      amount: amount,
      currency: currency,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      billNumber: billNumber
    });

    await payment.save();

    // Return the client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
}

// Webhook to handle successful payments
export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { paymentIntentId } = body;

    // Update payment status in database
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntentId },
      { status: 'succeeded' },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment });

  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json(
      { error: 'Error updating payment' },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(request) {
  try {
    await connectDB();

    // Get paymentIntentId from URL
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Find payment in database
    const payment = await Payment.findOne({ paymentIntentId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Error fetching payment' },
      { status: 500 }
    );
  }
}