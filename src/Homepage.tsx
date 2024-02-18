// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import React, {useEffect} from 'react';
import './CSS/Homepage.css';
import {validateUser} from "./Authentication/validateUser";
import {Link} from "react-router-dom";
import {Button} from "@/Components/ui/button";
import {handleLogin} from "@/Authentication/login";
import {useAuth} from "@/Authentication/AuthContext";

function Homepage() {
    const {user, isAuthenticated} = useAuth();

    useEffect(() => {
        document.title = "Harked"
        validateUser();
    }, [])


    const handleLogOut = () => {
        window.localStorage.clear();
        window.location.reload();
    }

    let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
    let welcomeMessage = "Just click log-in to get started exploring your Spotify profile in a new light. None of your log-in information is shared with us.";

    return (
        <section className="w-full pt-12 md:pt-24 lg:pt-32">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none">
                    Connect with Music Lovers
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Discover, share, and connect with fellow music enthusiasts from around the world.
                </p>
                <div className="flex flex-col gap-2">
                    {isAuthenticated ?
                        <Button asChild>
                            <Link to={`/profile/${user.id}`}>
                                Explore
                            </Link>
                        </Button>
                        :
                        <Button onClick={handleLogin}>
                            Join Now
                        </Button>

                    }

                    <Button asChild variant={"outline"}>
                        <Link
                            to={""}>
                            Read the blog
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default Homepage;
