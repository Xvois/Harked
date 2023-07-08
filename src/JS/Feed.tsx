import {useEffect, useState} from "react";
import {milliToHighestOrder, retrieveEventsForUser, retrieveLoggedUserID, UserEvent} from "./HDM.ts";
import {getItemType, getLIName} from "./Analysis";
import "./../CSS/Feed.css"

function FeedObject(props : {event: UserEvent, index: number}) {

    const {event, index} = props;

    const milliDiff = Date.now() - Date.parse(event.created);
    const time = milliToHighestOrder(milliDiff);

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
        <div className={event.ref_num < 51 ? 'major-feed-object' : 'minor-feed-object'} style={index !== 0 ? {borderTop: '1px solid var(--accent-colour)'} : {}}>
            <div className={'feed-image'} style={{position: 'relative'}}>
                <img alt={'backdrop-blur'} className={'backdrop-image'} src={event.item.image} />
                <img alt={getLIName(event.item)} className={'levitating-image'} src={event.item.image} />
            </div>
            <div>
                {event.ref_num < 51 && <h3 style={{margin: '0 0 10px 0'}}>{event.owner.username}</h3>}
                {getDescription()}
            </div>
            <p style={{fontFamily: 'Lato, sans-serif', margin: 'auto 0 0 auto', wordBreak: 'keep-all', color: 'var(--secondary-colour)'}}>
                {time.value}{time.unit} ago
            </p>
        </div>
    )
}

function LoadingObject (props : {index : number}) {

    const {index} = props;

    return (
        <div>
            <div className="placeholder" >
                <div className="animated-background" style={{animationDelay: `${index / 10}s`}}></div>
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
            <p style={{margin: 0}}>What the people you're following are up to.</p>
            <div className={'feed-wrapper'}>
                {events !== null ?
                    events.length > 0 ?
                        events.map((e,i) => {
                                return <FeedObject key={e.id} event={e} index={i} />
                            })
                        :
                        <p style={{color: 'var(--secondary-colour)'}}>Looks like there's nothing to see here yet. <br /> Follow some more people and wait for them to get up to something!</p>
                    :
                    <>
                        <LoadingObject index={0} key={0} />
                        <LoadingObject index={1} key={1} />
                        <LoadingObject index={2} key={2} />
                        <LoadingObject index={3} key={3} />
                    </>
                }
            </div>
        </div>
    )

}

export default Feed