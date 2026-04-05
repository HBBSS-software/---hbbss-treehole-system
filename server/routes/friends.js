const express = require('express');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// 发送好友请求
router.post('/request/:userId', auth, async(req, res) => {
    try {
        const targetId = req.params.userId;
        const myId = req.user._id;

        if (targetId === myId.toString()) {
            return res.status(400).json({ message: '不能添加自己为好友' });
        }

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ message: '用户不存在' });

        // 检查是否已经是好友
        if (req.user.friends && req.user.friends.includes(targetId)) {
            return res.status(400).json({ message: '已经是好友了' });
        }

        // 检查是否已有待处理的请求
        const existing = await FriendRequest.findOne({
            $or: [
                { from: myId, to: targetId, status: 'pending' },
                { from: targetId, to: myId, status: 'pending' }
            ]
        });
        if (existing) {
            if (existing.from.toString() === myId.toString()) {
                return res.status(400).json({ message: '已发送过好友请求，请等待对方处理' });
            } else {
                return res.status(400).json({ message: '对方已向你发送好友请求，请去好友页面处理' });
            }
        }

        const message = req.body.message || '';
        const request = new FriendRequest({ from: myId, to: targetId, message });
        await request.save();

        // 发送通知
        try {
            await new Notification({ recipient: targetId, sender: myId, type: 'friend_request' }).save();
        } catch (_) {}

        res.status(201).json({ message: '好友请求已发送' });
    } catch (e) { res.status(500).send(e.message); }
});

// 接受好友请求
router.post('/accept/:requestId', auth, async(req, res) => {
    try {
        const request = await FriendRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: '请求不存在' });
        if (request.to.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: '无权操作' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: '该请求已处理' });
        }

        request.status = 'accepted';
        await request.save();

        // 双方互加好友
        await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
        await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });

        // 通知对方
        try {
            await new Notification({ recipient: request.from, sender: req.user._id, type: 'friend_accept' }).save();
        } catch (_) {}

        res.json({ message: '已接受好友请求' });
    } catch (e) { res.status(500).send(e.message); }
});

// 拒绝好友请求
router.post('/reject/:requestId', auth, async(req, res) => {
    try {
        const request = await FriendRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: '请求不存在' });
        if (request.to.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: '无权操作' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: '该请求已处理' });
        }

        request.status = 'rejected';
        await request.save();
        res.json({ message: '已拒绝好友请求' });
    } catch (e) { res.status(500).send(e.message); }
});

// 删除好友
router.delete('/:userId', auth, async(req, res) => {
    try {
        const targetId = req.params.userId;
        const myId = req.user._id;

        await User.findByIdAndUpdate(myId, { $pull: { friends: targetId } });
        await User.findByIdAndUpdate(targetId, { $pull: { friends: myId } });

        // 清除双方的好友请求记录
        await FriendRequest.deleteMany({
            $or: [
                { from: myId, to: targetId },
                { from: targetId, to: myId }
            ]
        });

        res.json({ message: '已删除好友' });
    } catch (e) { res.status(500).send(e.message); }
});

// 获取我的好友列表
router.get('/list', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username avatar description');
        res.json(user.friends || []);
    } catch (e) { res.status(500).send(e.message); }
});

// 获取收到的好友请求
router.get('/requests/received', auth, async(req, res) => {
    try {
        const requests = await FriendRequest.find({ to: req.user._id, status: 'pending' })
            .populate('from', 'username avatar description')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (e) { res.status(500).send(e.message); }
});

// 获取发出的好友请求
router.get('/requests/sent', auth, async(req, res) => {
    try {
        const requests = await FriendRequest.find({ from: req.user._id, status: 'pending' })
            .populate('to', 'username avatar description')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (e) { res.status(500).send(e.message); }
});

// 获取与某用户的好友状态
router.get('/status/:userId', auth, async(req, res) => {
    try {
        const targetId = req.params.userId;
        const myId = req.user._id;

        // 是否已是好友
        const user = await User.findById(myId);
        if (user.friends && user.friends.map(id => id.toString()).includes(targetId)) {
            return res.json({ status: 'friends' });
        }

        // 是否有待处理请求
        const request = await FriendRequest.findOne({
            $or: [
                { from: myId, to: targetId, status: 'pending' },
                { from: targetId, to: myId, status: 'pending' }
            ]
        });
        if (request) {
            if (request.from.toString() === myId.toString()) {
                return res.json({ status: 'request_sent', requestId: request._id });
            } else {
                return res.json({ status: 'request_received', requestId: request._id });
            }
        }

        res.json({ status: 'none' });
    } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;