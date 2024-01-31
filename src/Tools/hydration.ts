import {postDatapoint, subscribe, unsubscribe} from "@api/pocketbase";
import {retrieveUser} from "./users";
import {Record, RecordSubscription} from "pocketbase";


export const postHydration = async (datapoints) => {
    for (const datapoint of datapoints) {
        await postDatapoint(datapoint).then(() => {
            console.info(datapoint.term + " success!");
        });
    }
}
/**
 * Runs the argument callback function as a side effect of a successful
 * hydration by the argument user_id.
 * @param user_id
 * @param callback
 */
export const onHydration = async (user_id: string, callback: Function) => {
    const user = await retrieveUser(user_id);
    const func = (e: RecordSubscription<Record>) => {
        if (e.action === "create" && e.record.term === "long_term" && e.record.owner === user.id) {
            console.info("Hydration event noted!");
            callback();
            destroyOnHydration();
        }
    }
    await subscribe("datapoints", "*", func);
}
/**
 * Destroys the onHydration subscription.
 *
 * **Should be called after a successful call of the
 * callback for the onHydration event.**
 */
const destroyOnHydration = async () => {
    await unsubscribe("datapoints", "*");
}