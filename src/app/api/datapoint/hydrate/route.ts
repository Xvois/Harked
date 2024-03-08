import {NextRequest} from "next/server";

export async function GET(request: NextRequest) {
    const cookie = request.cookies.get('spotify-auth');
    if (!cookie) {
        return Response.redirect('/login');
    }
}