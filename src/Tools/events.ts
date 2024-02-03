import {User} from "./Interfaces/userInterfaces";
import {retrieveUser} from "./users";
import {getLocalData, putLocalData} from "@/API/pocketbase";
import {Item} from "./Interfaces/databaseInterfaces";
import {resolveItems} from "./utils";
import {retrieveFollowing} from "./following";
import {ResUserEvent, UserEvent} from "./Interfaces/eventInterfaces";

// TODO: REMAKE
/**
 * Creates an event in the database.
 *
 * An event is any action that another user following the target user will be notified about.
 *  The event reference number is a reference to the type of event triggered.
 *
 *  1-50 | Major events
 *
 *  1: Added recommendation
 *
 *  2: Added annotations
 *
 *  3: Added review
 *
 *  51-100 | Minor events
 *
 *  51: Removes recommendation
 *
 *  52: Follows user
 *
 *  53: Edit recommendation
 *
 *
 * @param event_ref_num
 * @param user_id
 * @param item
 */
export const createEvent = async function (event_ref_num: number, user_id: string, item: Item) {
    //await disableAutoCancel();
    const user: User = await retrieveUser(user_id);
    await putLocalData("events",
        {
            owner: user.id,
            ref_num: event_ref_num,
            item: item
        }
    )
    //await enableAutoCancel();
}


export const retrieveEventsForUser = async function (user_id: string, page: number = 1, eventsPerPage: number = 50) {
    let resolvedUserEvents: Array<ResUserEvent<any>> = [];

    const following = await retrieveFollowing(user_id);
    const followingMap = new Map();

    // Create a map to reference users from their db id
    following.forEach(u => followingMap.set(u.id, u));
    const conditions = following.map(u => `owner.id = "${u.id}"`);
    const filter = conditions.join(" || ");

    let events = await getLocalData<UserEvent>("events", filter, '-created', page, eventsPerPage);

    // Replace the owner.id with the actual user object in the events array
    events.forEach(event => {
        if (event.owner && followingMap.has(event.owner)) {
            event.owner = followingMap.get(event.owner);
        }
    });

    const items = events.map(e => e.item);

    const resolvedItems = await resolveItems(items);
    // Now that we have the resolved items, we can replace the item in the event with the resolved item and add this to the resolvedUserEvents array. We will iterate through the keys of the resolvedItems object and find the event that matches the item id.
    Object.keys(resolvedItems).forEach(key => {
        const event = events.find(e => e.item.id === key);
        resolvedUserEvents.push({
            ...event,
            item: resolvedItems[key]
        });
    });

    return resolvedUserEvents;
}
