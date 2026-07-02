# ต่อ Leaderboard เข้ากับ Supabase

ค่าเริ่มต้นของเกมใช้ **โหมดทดลอง** — คะแนนเก็บใน `localStorage` ของเครื่องนั้นๆ (ไม่แชร์ข้ามเครื่อง) เหมาะสำหรับทดสอบ พอพร้อมใช้จริงให้ต่อ Supabase ตามขั้นตอนนี้ (ฟรี ไม่ต้องมี server ของตัวเอง)

## 1. สร้าง Supabase project
1. สมัคร/เข้าสู่ระบบที่ https://supabase.com → **New project**
2. ตั้งชื่อ + รหัสผ่าน database + เลือก region (แนะนำ Singapore สำหรับผู้เล่นไทย)
3. รอสร้างเสร็จ (~1–2 นาที)

## 2. สร้างตาราง + สิทธิ์การเข้าถึง
เปิดเมนู **SQL Editor** → วางสคริปต์นี้ → **Run**

```sql
create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  score int not null check (score >= 0 and score <= 2000),
  mode text not null default 'normal',
  category text,
  created_at timestamptz not null default now()
);

-- เปิด Row Level Security แล้วอนุญาตเฉพาะที่ต้องการ
alter table public.scores enable row level security;

-- ใครก็อ่านกระดานได้
create policy "read all" on public.scores
  for select using (true);

-- ส่งคะแนนได้เฉพาะที่ค่าอยู่ในช่วงสมเหตุสมผล (กันสแปมเบื้องต้น)
create policy "insert valid" on public.scores
  for insert with check (
    score between 0 and 2000 and char_length(name) between 1 and 20
  );

-- อินเด็กซ์ให้ดึง top N เร็ว
create index scores_score_idx on public.scores (score desc);
```

> คะแนนสูงสุดที่เป็นไปได้ = 10 ข้อ × 200 = **2000** จึงตั้ง CHECK ไว้ที่ 2000

## 3. เอา URL และ anon key มาใส่
1. เมนู **Project Settings → API**
2. คัดลอก **Project URL** และ **anon public** key
3. เปิดไฟล์ [config.js](config.js) แล้วเติมค่า:

```js
window.QUIZDASH_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseKey: 'eyJhbGciOi...'   // anon public key
};
```

> **anon key ใส่ในโค้ดฝั่ง client ได้อย่างปลอดภัย** — มันถูกออกแบบมาให้เปิดเผยได้ ความปลอดภัยจริงอยู่ที่ RLS policy ด้านบน (อย่าเอา `service_role` key มาใส่เด็ดขาด)

## 4. เสร็จแล้ว
รีเฟรชเกม — เมื่อ `config.js` มีค่าครบ เกมจะสลับจากโหมดทดลองไปใช้ Supabase อัตโนมัติ (ป้าย "โหมดทดลอง" บนหน้าอันดับจะหายไป) คะแนนจากทุกเครื่องจะมารวมบนกระดานเดียวกัน

## ข้อจำกัด / ก้าวต่อไป (optional)
- คะแนนยังส่งจากฝั่ง client → ปลอมได้ด้วยการแก้โค้ดในเบราว์เซอร์ RLS/CHECK กันได้แค่ค่าที่เกินช่วง สำหรับเกม casual ยอมรับได้ ถ้าต้องการเข้มขึ้นค่อยเพิ่ม **Supabase Edge Function** ตรวจสอบคำตอบฝั่ง server ภายหลัง
- อยากได้กระดานรายวัน/รายหมวด: ตาราง `scores` เก็บ `mode`, `category`, `created_at` ไว้แล้ว ต่อยอด query ได้เลย
