// การตั้งค่า leaderboard — เว้นว่าง = โหมดทดลอง (เก็บคะแนนใน localStorage เครื่องนี้)
// ต่อ Supabase: ใส่ URL และ anon public key (public-safe เพราะคุมด้วย RLS) ดูขั้นตอนใน LEADERBOARD-SETUP.md
window.QUIZDASH_CONFIG = {
  supabaseUrl: 'https://knfzjdmmilnggfltcswz.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnpqZG1taWxuZ2dmbHRjc3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTg1MDIsImV4cCI6MjA5ODU3NDUwMn0.Dnf4hGK71gFn0EY8yOP8UPC6fLQthsUHkBFGSggNJ5M',
};
