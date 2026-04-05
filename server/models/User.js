const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema({
    uid: { type: Number, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatar: { type: String, default: null },
    description: { type: String, default: '', maxlength: 500 },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subscribedSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
    if (this.uid) return;
    let counter = await Counter.findById('userId');
    if (!counter) {
        counter = await Counter.create({ _id: 'userId', seq: 100001 });
    } else {
        counter = await Counter.findByIdAndUpdate('userId', { $inc: { seq: 1 } }, { returnDocument: 'after' });
    }
    this.uid = counter.seq;
});

module.exports = mongoose.model('User', userSchema);