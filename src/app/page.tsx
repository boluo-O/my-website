import SeatsViewer from "./SeatsViewer"

export default function Home() {
    return (
        <div className="flex flex-col h-screen p-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Demo Seats Viewer</h1>
                <p className="text-gray-600">
                    Select from the thumbnails on the left
                </p>
            </header>

            <SeatsViewer />
        </div>
    )
}
