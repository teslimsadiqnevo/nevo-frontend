export function StudentDashboard() {
  return (
    <div className="p-8 flex flex-col items-center min-h-screen">
      <h1 className="text-3xl font-bold mt-10">Student Dashboard</h1>
      <p className="mt-4 text-graphite-70 text-lg">Welcome back! Ready to learn?</p>
      
      <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-4xl">
         <div className="bg-amber-50 p-6 rounded-2xl flex flex-col items-center border border-amber-200">
            <h2 className="font-semibold text-xl">Current Lesson</h2>
            <p className="mt-2 text-graphite-60">Pick up where you left off</p>
         </div>
         <div className="bg-indigo-5 p-6 rounded-2xl flex flex-col items-center border border-indigo-10">
            <h2 className="font-semibold text-xl">My Progress</h2>
            <p className="mt-2 text-graphite-60">See your achievements</p>
         </div>
      </div>
    </div>
  );
}
