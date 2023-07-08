import {useEffect, useState} from "react";
import {retrieveEventsForUser, retrieveLoggedUserID, UserEvent} from "./HDM.ts";
import {getItemType, getLIName} from "./Analysis";
import "./../CSS/Feed.css"

function FeedObject(props : {event: UserEvent, index: number}) {

    const {event, index} = props;

    const getDescription = () => {
        const itemType = getItemType(event.item);
        switch (event.ref_num){
            case 1:
                return <p className={'feed-object-desc'}><a href={`/profile#${event.owner.user_id}`}>{event.owner.username}</a> has added the {itemType.slice(0, itemType.length-1)} <a href={event.item.link}>{getLIName(event.item)}</a> to their recommendations.</p>
            case 51:
                return <p className={'feed-object-desc'}><a href={`/profile#${event.owner.user_id}`}>{event.owner.username}</a> has removed <a href={event.item.link}>{getLIName(event.item)}</a> from their recommendations.</p>
            case 52:
                return <p className={'feed-object-desc'}><a href={`/profile#${event.owner.user_id}`}>{event.owner.username}</a> followed <a href={`/profile#${event.item.user_id}`}>{event.item.username}</a>.</p>
        }
    }

    return (
        <div className={event.ref_num < 51 ? 'major-feed-object' : 'minor-feed-object'}>
            <div className={'feed-image'} style={{position: 'relative'}}>
                <img alt={'backdrop-blur'} className={'backdrop-image'} src={event.item.image} />
                <img alt={getLIName(event.item)} className={'levitating-image'} src={event.item.image} />
            </div>
            <div>
                {event.ref_num < 51 && <h3 style={{margin: '0 0 10px 0'}}>{event.owner.username}</h3>}
                {getDescription()}
            </div>
        </div>
    )
}

const Feed = () => {

    const [events, setEvents] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const user_id = await retrieveLoggedUserID();
            return await retrieveEventsForUser(user_id);
        }

        fetchData().then( (e : Array<UserEvent>) => setEvents(e));

    }, [])

    return  (
        <div>
            <h1>Your feed.</h1>
            <p>What the people you're following are up to.</p>
            {
                events !== null ?
                    events.length > 0 ?
                        <div className={'feed-wrapper'}>
                            {events.map((e,i) => {
                                return <FeedObject key={e.id} event={e} index={i} />
                            })
                            }
                        </div>
                        :
                        <p style={{color: 'var(--secondary-colour)'}}>Looks like there's nothing to see here yet. <br /> Follow some more people and wait for them to get up to something!</p>
                    :
                    <></>
            }
        </div>
    )

}

export default Feed