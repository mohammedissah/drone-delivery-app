import mongoose from 'mongoose';

const flightLogSchema = new mongoose.Schema({
  timestamp: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'alert'],
    default: 'info'
  },
  droneId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const FlightLog = mongoose.model('FlightLog', flightLogSchema);
