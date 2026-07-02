# ADR-001: เก็บคลังคำถามไว้ที่ไหน

**Status:** Proposed
**Date:** 2026-07-02
**Deciders:** เจ้าของโปรเจกต์

## Context

ตอนนี้คำถามทั้ง 40 ข้อ hardcode อยู่ใน `index.html` ปนกับโค้ดเกม ข้อจำกัดและแรงผลักดัน:

- เกมเป็น **static HTML ไฟล์เดียว** ไม่มี build step, ไม่มี backend — ข้อดีนี้อยากรักษาไว้ให้นานที่สุด (deploy ง่าย, เปิดจากไฟล์ตรงๆ ก็ได้)
- Roadmap ต้องการ: **เพิ่มหมวด** (กีฬา/บันเทิง/วิทยาศาสตร์), **Daily Challenge** (ทุกคนได้ชุดเดียวกันต่อวัน), **ท้าเพื่อน** (ลิงก์ที่ได้ชุดคำถามเดียวกัน), **Leaderboard**, และไกลๆ คือ **คำถามจากชุมชน (UGC)**
- คนแก้คำถามอาจไม่ใช่โปรแกรมเมอร์ — แก้ไฟล์ HTML 700 บรรทัดเสี่ยงพังโค้ดเกม
- คำถามเป็นข้อความล้วน ขนาดเล็กมาก (100 ข้อ ≈ 20–30 KB) — ปริมาณข้อมูลไม่ใช่ปัญหา ปัญหาคือ **โครงสร้างและ workflow**

## Decision

**เฟสปัจจุบัน: แยกคำถามออกเป็นไฟล์ข้อมูล JS ต่อหมวด (Option B) พร้อมใส่ `id` ประจำคำถามตั้งแต่วันนี้ → ย้ายเข้า Supabase/Firebase (Option C) เมื่อถึง Phase 2 ที่ต้องมี leaderboard อยู่แล้ว**

## Options Considered

### Option A: Hardcode ใน index.html ต่อไป (status quo)

| Dimension | Assessment |
|-----------|------------|
| Complexity | ต่ำที่สุด |
| Cost | ฟรี |
| Scalability | แย่ — ไฟล์บวมเมื่อเพิ่มหมวด/คำถาม |
| แก้คำถามง่ายไหม | แย่ — ต้องแก้กลางโค้ดเกม เสี่ยงพัง |

**Pros:** ไม่ต้องทำอะไร, ไฟล์เดียวจบ, ไม่มี network request เพิ่ม
**Cons:** เพิ่ม 3 หมวด × 100 ข้อ = ไฟล์ HTML หลายพันบรรทัด, แก้คำถามผิดที่เดียวเกมพังทั้งเกม, diff/review ยาก, ทำ UGC ไม่ได้เลย

### Option B: ไฟล์ข้อมูล JS แยกต่อหมวด (static, no backend) ✅ เลือกสำหรับตอนนี้

```
data/
  questions.general.js        → window.QUIZ_DATA.general = { version: 1, questions: [...] }
  questions.sports.js
  questions.entertainment.js
  questions.science.js
```

โหลดด้วย `<script src>` ธรรมดา (ไม่ใช้ `fetch()` JSON — จงใจ เพราะ `fetch` โดน CORS block เมื่อเปิดไฟล์แบบ `file://` แต่ `<script>` ไม่โดน จึงยังดับเบิลคลิกเปิดเล่นได้เหมือนเดิม)

| Dimension | Assessment |
|-----------|------------|
| Complexity | ต่ำ (แค่ย้ายข้อมูล + สคีมา) |
| Cost | ฟรี — ยัง static hosting ได้ทุกที่ |
| Scalability | ดีพอถึงหลักพันข้อ/หลายหมวด |
| แก้คำถามง่ายไหม | ดี — แก้ไฟล์ข้อมูลล้วน ไม่แตะโค้ดเกม |

**Pros:**
- แยก **เนื้อหา** ออกจาก **โค้ด** — เพิ่ม/แก้คำถามโดยไม่เสี่ยงพังเกม, git diff อ่านรู้เรื่อง
- เปิดทางทุกฟีเจอร์ Phase 1 โดย **ไม่ต้องมี backend**:
  - **Daily Challenge**: สุ่มด้วย PRNG ที่ seed จากวันที่ (เช่น `"2026-07-02"`) → ทุกคนได้ชุดเดียวกันโดยไม่ต้องมีเซิร์ฟเวอร์
  - **ท้าเพื่อน**: ใส่ seed ใน URL (`?ch=xyz`) → เพื่อนได้ชุดคำถามเดียวกัน
  - ทั้งสองอย่างต้องการ **`id` คำถามที่คงที่** — เหตุผลที่ต้องใส่ id ตั้งแต่วันนี้
- โหลดเฉพาะหมวดที่เล่นได้ (lazy inject `<script>`) หรือโหลดหมดก็ได้เพราะเล็กมาก

**Cons:**
- คำตอบยังอยู่ฝั่ง client → โกงได้ด้วยการเปิด DevTools (ยอมรับได้จนกว่าจะมี leaderboard ที่มีเงินเดิมพันชื่อเสียง)
- อัปเดตคำถามต้อง deploy ไฟล์ใหม่ (ไม่ realtime)
- UGC ยังทำไม่ได้

### Option C: Backend / BaaS (Supabase หรือ Firebase) ตั้งแต่ตอนนี้

| Dimension | Assessment |
|-----------|------------|
| Complexity | กลาง–สูง (auth, API, schema, env) |
| Cost | ฟรี tier พอ แต่มี operational burden |
| Scalability | ดีที่สุด |
| แก้คำถามง่ายไหม | ดีมาก (แก้ใน dashboard ได้ realtime) |

**Pros:** อัปเดตคำถามไม่ต้อง deploy, ซ่อนเฉลยฝั่ง server ได้, พร้อมสำหรับ UGC/leaderboard/บัญชี
**Cons:** **เร็วเกินความจำเป็น** — ยังไม่มีฟีเจอร์ไหนตอนนี้ที่ *ต้อง* ใช้ backend, เพิ่ม dependency/จุดพังใหม่ (เกมจะเล่นไม่ได้ถ้า API ล่ม), เสียคุณสมบัติ "เปิดไฟล์ก็เล่นได้", ต้องดูแล key/quota

## Trade-off Analysis

หัวใจของการตัดสินใจ: **ฟีเจอร์ Phase 1 ทั้งหมด (หลายหมวด, Daily Challenge, ท้าเพื่อน) ทำได้ด้วย static file + deterministic seed โดยไม่ต้องมี backend เลย** สิ่งเดียวที่บังคับให้มี backend จริงๆ คือ leaderboard กับ UGC ซึ่งเป็น Phase 2–3

ดังนั้นการรีบขึ้น backend ตอนนี้คือจ่ายต้นทุน (ความซับซ้อน, จุดพัง, การดูแล) ก่อนได้ประโยชน์ ส่วนการอยู่กับ hardcode ต่อ (Option A) คือเก็บหนี้เทคนิคที่แพงขึ้นทุกครั้งที่เพิ่มคำถาม

**สิ่งสำคัญที่สุดที่ต้องทำวันนี้เพื่อไม่ให้ย้ายยากวันหน้า คือสคีมา ไม่ใช่ storage:**

```js
// data/questions.general.js
window.QUIZ_DATA = window.QUIZ_DATA || {};
window.QUIZ_DATA.general = {
  version: 1,
  category: 'general',
  questions: [
    {
      id: 'gen-0001',            // คงที่ตลอดไป — ใช้อ้างใน daily seed, challenge link, สถิติ
      text: 'เมืองหลวงของประเทศไทยคือเมืองใด?',
      options: ['กรุงเทพมหานคร', 'เชียงใหม่', 'ภูเก็ต', 'ขอนแก่น'],
      correct: 0,
      difficulty: 1,             // 1=ง่าย 2=กลาง 3=ยาก — รองรับ adaptive difficulty
    },
  ],
};
```

สคีมานี้ map ตรงเป็นตาราง `questions` ใน Supabase ได้ 1:1 — วันที่ย้ายจริงแทบไม่ต้องแก้โค้ดเกม แค่เปลี่ยนแหล่งโหลด

## Consequences

**ง่ายขึ้น:**
- เพิ่มหมวด/คำถามใหม่ = เพิ่มไฟล์ข้อมูล ไม่แตะโค้ดเกม
- Daily Challenge และท้าเพื่อนทำได้ทันทีแบบไม่มี backend (seed + id)
- คนไม่เขียนโค้ดช่วยเขียนคำถามได้ (แก้ไฟล์ข้อมูลล้วน)

**ยากขึ้น / ต้องยอมรับ:**
- มีหลายไฟล์แทนไฟล์เดียว (ต้อง deploy เป็นโฟลเดอร์)
- เฉลยยังเปิดดูได้ฝั่ง client จนกว่าจะย้ายเข้า backend

**ต้อง revisit เมื่อ:** เริ่มทำ leaderboard จริง (Phase 2) → ย้ายคำถาม + ตรวจคำตอบขึ้น Supabase, ไฟล์ static เดิมกลายเป็น offline fallback ได้

## Action Items

1. [ ] สร้าง `data/questions.general.js` ตามสคีมาข้างบน ย้าย 40 ข้อปัจจุบันไป พร้อมใส่ `id` และ `difficulty`
2. [ ] แก้ `index.html` ให้อ่านจาก `window.QUIZ_DATA[category]` แทนตัวแปร `QUESTIONS`
3. [ ] เขียนคำถามหมวดกีฬา/บันเทิง/วิทยาศาสตร์ (หมวดละ ~40 ข้อ) แล้วปลดล็อกหมวด
4. [ ] (Phase 1) ทำ seeded PRNG สำหรับ Daily Challenge / ลิงก์ท้าเพื่อน โดยอ้างอิงคำถามด้วย `id`
5. [ ] (Phase 2) ประเมิน Supabase ตอนเริ่ม leaderboard — migrate สคีมาเดิมเข้า Postgres ตรงๆ
