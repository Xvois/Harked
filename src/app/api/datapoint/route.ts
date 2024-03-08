import {NextRequest} from "next/server";


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const res = await fetch(`https://harked.pockethost.io/datapoints/records?filer=${filter}`);
    const datapoint = await res.json();
    return Response.json({datapoint});
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const res = await fetch(`https://harked.pockethost.io/datapoints/records`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const datapoint = await res.json();
    return Response.json({datapoint});
}