import {useEffect, useState} from "react";
import {isLoggedIn, milliToHighestOrder, retrieveEventsForUser, retrieveLoggedUserID, UserEvent} from "./Data Tools/HDM.ts";
import {getItemType, getLIName} from "./Analysis";
import "./../CSS/Feed.css"
import {LoadingIndicator, LoadingObject, PageError} from "./SharedComponents.tsx";

function FeedObject(props: { user_id: string, event: UserEvent, index: number, maxEventsPerLoad: number }) {

    const {user_id, event, index, maxEventsPerLoad} = props;

    const milliDiff = Date.now() - Date.parse(event.created);
    const time = milliToHighestOrder(milliDiff);

    const getDescription = () => {
        console.log(event.owner)
        const itemType = getItemType(event.item);
        switch (event.ref_num) {
            case 1:
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a> has
                    added the {itemType.slice(0, itemType.length - 1)} <a className={'heavy-link'}
                                                                          href={event.item.link}>{getLIName(event.item)}</a> to
                    their recommendations.</p>
            case 2:
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a> has
                    added annotations to <a className={'heavy-link'}
                                            href={`/playlist/${event.item.playlist_id}`}>{getLIName(event.item)}</a>.</p>
            case 3:
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/reviews/${event.owner.user_id}`}>{event.owner.username}</a> has
                    reviewed <a className={'heavy-link'}
                                    href={event.item.link}>{getLIName(event.item)}</a>.</p>
            case 51:
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a> has
                    removed <a className={'heavy-link'} href={event.item.link}>{getLIName(event.item)}</a> from their
                    recommendations.</p>
            case 52:
                const targetPronoun = user_id === event.item.user_id ? 'you' : event.item.username;
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a> followed <a
                    className={'heavy-link'} href={`/profile/${event.item.user_id}`}>{targetPronoun}</a>.</p>
            case 53:
                return <p className={'feed-object-desc'}><a className={'heavy-link'}
                                                            href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a> has
                    edited their recommendation for the {itemType.slice(0, itemType.length - 1)} <a
                        className={'heavy-link'} href={event.item.link}>{getLIName(event.item)}</a>.</p>
        }
    }

    return (
        event.owner && event.item &&
        <div className={event.ref_num < 51 ? 'major-feed-object' : 'minor-feed-object'} style={index !== 0 ? {
            borderTop: '1px solid var(--accent-colour)',
            animationDelay: `${(index % maxEventsPerLoad) / 20}s`
        } : {}}>
            <div className={'feed-image'} style={{position: 'relative'}}>
                <img alt={'backdrop-blur'} className={'backdrop-image'} src={event.item.image}/>
                <img alt={getLIName(event.item)} className={'levitating-image'} src={event.item.image}/>
            </div>
            <div>
                {event.ref_num < 51 && <h3 style={{margin: '0 0 10px 0'}}><a
                    style={{textDecoration: 'none', color: 'var(--primary-colour)'}}
                    href={`/profile/${event.owner.user_id}`}>{event.owner.username}</a></h3>}
                {getDescription()}
            </div>
            <p style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                fontFamily: 'Lato, sans-serif',
                wordBreak: 'keep-all',
                color: 'var(--secondary-colour)'
            }}>
                {time.value}{time.unit} ago
            </p>
        </div>
    )
}

const Feed = () => {

    const [user_id, setUser_id] = useState(null);
    const [events, setEvents] = useState(null);
    const [feedPage, setFeedPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});
    const maxEventsPerLoad = 20;

    useEffect(() => {
        const fetchData = async () => {
            const user_id = await retrieveLoggedUserID();
            setUser_id(user_id);
            return await retrieveEventsForUser(user_id, feedPage, maxEventsPerLoad);
        }

        if (isLoggedIn()) {
            fetchData().then((e: Array<UserEvent>) => {
                setEvents(e)
                if (e.length < maxEventsPerLoad) {
                    console.info('Loaded all at once.')
                    setHasMore(false);
                } else {
                    console.info('Feed is truncated and will attempt to load more on scroll.')
                }
            });
        } else {
            setIsError(true);
            setErrorDetails({description: "Viewing the feed requires being logged in."});
        }

    }, [])

    const fetchMoreEvents = async () => {
        if (hasMore) {
            console.info(`Fetching more! maxEventsPerLoad: ${maxEventsPerLoad} feedPage: ${feedPage}`)
            setIsLoading(true);
            const newEvents = await retrieveEventsForUser(user_id, feedPage + 1, maxEventsPerLoad);
            if (newEvents.length !== 0) {
                const feedPageVal = feedPage;
                setFeedPage(feedPageVal + 1);
                const totalEvents = events.concat(newEvents);
                setEvents(totalEvents);
                setIsLoading(false);
                if (newEvents.length < maxEventsPerLoad) {
                    setHasMore(false);
                }
            }
        }
    }

    window.onscroll = () => {
        const buffer = 500;
        if (window.innerHeight + document.documentElement.scrollTop >= ( document.documentElement.offsetHeight - buffer ) && isLoggedIn() && !isLoading) {
            fetchMoreEvents().catch(err => {
                setIsError(true);
                setErrorDetails({
                    description: "There was a critical error fetching more events.",
                    errCode: "fetchMoreEvents_failure"
                })
                console.error('Error fetching more events: ', err);
            });
        }
    }


    return (
        isError ?
            <PageError description={errorDetails.description} errCode={errorDetails.errCode}/>
            :
            <div>
                <h1 style={{margin: '15px 0 0 0px'}}>Your feed.</h1>
                <p style={{margin: '0 0 15px 0'}}>What the people you're following are up to.</p>
                <div className={'feed-wrapper'}>
                    {events !== null ?
                        events.length > 0 ?
                            <>
                                {
                                    events.map((e, i) => {
                                        return <FeedObject key={e.id} user_id={user_id} event={e} index={i}
                                                           maxEventsPerLoad={maxEventsPerLoad}/>
                                    })
                                }
                                {hasMore ?
                                    isLoading ?
                                        <div style={{position: 'relative', marginTop: '50px'}}>
                                            <LoadingIndicator/>
                                        </div>
                                        :
                                        isError ?
                                            <p style={{
                                                margin: 'auto',
                                                padding: '15px',
                                                borderTop: '1px solid var(--accent-colour)',
                                                color: 'red'
                                            }}>An error occurred loading your feed.</p>

                                            :
                                            <></>
                                    :
                                    <p style={{
                                        margin: 'auto',
                                        padding: '15px',
                                        borderTop: '1px solid var(--accent-colour)',
                                        color: 'var(--secondary-colour)'
                                    }}>You've reached the end of your feed.</p>
                                }
                            </>

                            :
                            <p style={{color: 'var(--secondary-colour)'}}>Looks like there's nothing to see here
                                yet. <br/> <br/> Follow some more people and wait for them to get up to something!</p>
                        :
                        <>
                            <LoadingObject num={7}/>
                        </>
                    }
                </div>
            </div>
    )

}

export default Feed