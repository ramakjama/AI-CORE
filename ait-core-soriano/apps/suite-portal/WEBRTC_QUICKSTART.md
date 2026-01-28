# 🚀 WebRTC Video Call - Quick Start

## 3-Step Setup

### Step 1️⃣: Install Dependencies
```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

### Step 2️⃣: Start Signaling Server (New Terminal)
```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
node signaling-server-example.js
```

You should see:
```
🚀 WebRTC Signaling Server started on ws://localhost:1234/signaling
📡 Waiting for connections...
```

### Step 3️⃣: Start Development Server (New Terminal)
```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm dev
```

Then open: **http://localhost:3001**

---

## 🎥 Testing Your First Call

1. **Open the Application**
   - Navigate to http://localhost:3001
   - You should see the suite portal

2. **Click Video Call Button**
   - Look for the camera icon (📹) in the topbar
   - Click it to open the video call modal

3. **Grant Permissions**
   - Browser will ask for camera/microphone access
   - Click "Allow"

4. **See Your Video**
   - Your local video preview appears in bottom-right corner
   - You're now ready to call!

5. **Test with Multiple Users**
   - Open another browser tab (or window)
   - Click the video call button in both tabs
   - Both users will see each other

---

## 🎮 Controls

| Button | Action |
|--------|--------|
| 🎤 Mic | Mute/unmute microphone |
| 📹 Camera | Turn camera on/off |
| 🖥️ Screen | Share your screen |
| ❌ Red Button | End call |
| ⛶ Fullscreen | Toggle fullscreen |

---

## 🐛 Troubleshooting

### ❌ "Cannot find module 'simple-peer'"
```bash
pnpm install
# or
npm install simple-peer @types/simple-peer
```

### ❌ Camera not working
- Ensure you're on **http://localhost:3001** (localhost is allowed)
- Check browser permissions
- Close other apps using camera (Zoom, Teams, etc.)

### ❌ Signaling server not connecting
- Verify server is running: Check terminal for "🚀 WebRTC Signaling Server started"
- Check port 1234 is not in use
- Look for errors in browser console (F12)

### ❌ Can't see other user
- Ensure both users are connected to same signaling server
- Check browser console for errors
- Verify both users granted camera permissions

---

## 📂 Project Structure

```
apps/suite-portal/
├── src/
│   ├── lib/webrtc/              ← Core WebRTC logic
│   ├── hooks/use-video-call.ts  ← React hook
│   └── components/
│       └── video-call/          ← UI components
├── signaling-server-example.js  ← Run this first!
└── package.json                 ← Dependencies
```

---

## 📚 Full Documentation

- **📖 Complete Guide**: `WEBRTC_VIDEO_CALL_SYSTEM.md`
- **🔧 Installation**: `WEBRTC_INSTALLATION.md`
- **📋 Summary**: `WEBRTC_SUMMARY.md`

---

## 🎯 What's Next?

Once you have basic calls working:

1. ✅ Test with 3+ participants
2. ✅ Try screen sharing
3. ✅ Test on different browsers
4. 🔲 Set up production TURN servers
5. 🔲 Deploy signaling server to cloud
6. 🔲 Add user authentication

---

**Need Help?** Check `WEBRTC_INSTALLATION.md` for detailed troubleshooting.

**Ready to Deploy?** See `WEBRTC_VIDEO_CALL_SYSTEM.md` production section.
