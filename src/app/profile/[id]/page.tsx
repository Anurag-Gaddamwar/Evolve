import AppSidebarShell from "../../components/AppSidebarShell";

export default function UserProfile({params}: any) {
    return (
        <AppSidebarShell title="Profile">
            <div className="flex flex-col items-center justify-center min-h-full py-2 text-[#ececec]">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <hr />
            <p className="text-4xl">Profile page 
            <span className=" p-2 ml-2 rounded bg-orange-500 text-black">{params.id}</span>
            </p>

            </div>
        </AppSidebarShell>
    )
}