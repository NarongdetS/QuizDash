# ต่อ Analytics เข้ากับ PostHog

ค่าเริ่มต้นใช้ **โหมด console** — ไม่ส่งข้อมูลออกไปไหน (ตั้ง `window.__ANALYTICS_DEBUG = true` ใน DevTools เพื่อดู event ที่ยิงระหว่างเล่น) พอพร้อมเก็บสถิติจริงให้ต่อ PostHog ตามนี้ (ฟรี 1M events/เดือน ไม่ต้องมี server)

## 1. สร้าง PostHog project
1. สมัคร/เข้าสู่ระบบที่ https://posthog.com → สร้าง project
2. เลือก region: **US** (`https://us.i.posthog.com`) หรือ **EU** (`https://eu.i.posthog.com`) — EU เหมาะกับ privacy/PDPA มากกว่า
3. ไปที่ **Project Settings** คัดลอก **Project API Key** (ขึ้นต้น `phc_...`)

## 2. ใส่ key ใน config.js
เปิด [config.js](config.js) เติมค่า:
```js
window.QUIZDASH_CONFIG = {
  // ... supabase ...
  posthogKey: 'phc_xxxxxxxxxxxxxxxx',
  posthogHost: 'https://us.i.posthog.com',   // หรือ https://eu.i.posthog.com ถ้าเลือก EU
};
```
รีเฟรชเว็บ — เกมจะเริ่มส่ง event เข้า PostHog อัตโนมัติ (โหมด console จะปิดไปเอง)

> **Privacy:** เกม**ไม่ส่งชื่อผู้เล่นหรือ PII** เข้า PostHog เลย — ส่งแค่ event + ค่าที่ไม่ระบุตัวตน (หมวด/โหมด/คะแนนเป็นตัวเลข) เปิด `autocapture:false` และ `capture_pageview:false` ไว้แล้ว เก็บเฉพาะ event ที่เรากำหนดเอง

## Event ที่เก็บ

| Event | ยิงเมื่อ | props |
|---|---|---|
| `app_opened` | เปิดเว็บ | `via_challenge` (มาจากลิงก์ท้า), `standalone` (เปิดจากไอคอน PWA) |
| `game_started` | เริ่มเกม | `mode` (normal/daily/challenge), `category`, `role` (create/accept สำหรับ challenge) |
| `game_finished` | เล่นจบ | `mode`, `category`, `score`, `correct`, `total`, `avg_time` |
| `daily_completed` | จบ daily | `streak`, `score` |
| `challenge_result` | จบ challenge ที่มีเป้า | `won`, `tie`, `target`, `score` |
| `score_submitted` | ส่งขึ้นกระดาน | `mode`, `score` |
| `shared` | กดแชร์ | `type` (score/challenge), `channel` (native/clipboard/line) |
| `leaderboard_viewed` | เปิดหน้าอันดับ | — |

## Metrics ที่ดูได้ (ตาม ROADMAP)
- **Funnel** `app_opened → game_started → game_finished` (ดู drop-off)
- **Retention** — PostHog คำนวณจาก distinct user อัตโนมัติ (ใช้ localStorage id)
- **K-factor** — `shared` (ออก) เทียบ `app_opened {via_challenge:true}` (เข้า)
- **Share rate** — `shared` / `game_finished`
- **Daily engagement** — `daily_completed` + สตรีค
