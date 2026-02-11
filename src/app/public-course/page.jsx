export const dynamic = "force-dynamic";

async function getCourses() {
  const res = await fetch("http://localhost:3000/api/public/courses", {
    cache: "no-store",
  });
  return res.json();
}

export default async function Page() {
  const data = await getCourses();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold">Public Courses</h1>
      <p className="mt-2 text-slate-500">รายการหลักสูตรที่ sync มาแล้ว</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        {!data?.ok ? (
          <div className="text-red-600">Load failed: {data?.error}</div>
        ) : (
          <ul className="space-y-2">
            {data.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between border-b py-2 last:border-b-0"
              >
                <span className="font-medium">{it.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
