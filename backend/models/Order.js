import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  recipient: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  item: {
    type: String,
    required: true
  },
  weightKg: {
    type: Number,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  dropZoneType: {
    type: String,
    default: 'Backyard Lawn'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'AIRBORNE', 'DELIVERING', 'DELIVERED', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  assignedDrone: {
    type: String,
    default: 'AERO-X1'
  },
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const Order = mongoose.model('Order', orderSchema);
