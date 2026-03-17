// Layout provides AppSidebarShell automatically


export default function UserProfile({params}: any) {
    return (
        <div className="flex flex-col items-center justify-center min-h-full py-2 text-[#ececec]">
            <h1 className="text-2xl font-semibold">User Profile</h1>
            <hr />
            <p className="text-4xl">Viewing profile ID: 
            <span className="p-2 ml-2 rounded bg-emerald-500 text-black font-bold">{params.id}</span>
            </p>
            <p className="text-lg mt-4 text-gray-400">This is the dynamic profile page for public user profiles.</p>
        </div>
    )
}
