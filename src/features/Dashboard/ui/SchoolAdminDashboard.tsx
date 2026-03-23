export function SchoolAdminDashboard() {
  return (
    <div className="p-8 flex flex-col items-center min-h-screen">
      <h1 className="text-3xl font-bold mt-10">School Admin Dashboard</h1>
      <p className="mt-4 text-graphite-70 text-lg">Welcome to the administration portal.</p>
      
      <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-4xl">
         <div className="bg-lavender-15 p-6 rounded-2xl flex flex-col items-center">
            <h2 className="font-semibold text-xl">Teachers</h2>
            <p className="mt-2 text-graphite-60">Manage your staff</p>
         </div>
         <div className="bg-lavender-15 p-6 rounded-2xl flex flex-col items-center">
            <h2 className="font-semibold text-xl">Students</h2>
            <p className="mt-2 text-graphite-60">Overview of student body</p>
         </div>
      </div>
    </div>
  );
}
