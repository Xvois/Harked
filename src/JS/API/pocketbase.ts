import PocketBase from "pocketbase";
import {Datapoint} from "../Data Tools/datapointInterfaces";

export const createNewPBInstance = () => {
    return new PocketBase("https://harked.pockethost.io/");
}

const pb = createNewPBInstance();

/**
 * Gets the first list item with a matching user id.
 * @param user_id The user's global user ID.
 * @returns {Promise<*>} A user object.
 */
export const getUser = async (user_id) => {
    return await pb.collection('users').getFirstListItem(`user_id="${user_id}"`)
        .catch(
            function (err) {
                console.warn("Error getting user: ");
                console.warn(err);
            }
        );
}

/**
 * Will return all the user IDs in the database.
 * @returns {Promise<Array<Record>>} An array.
 */
export const getAllUserIDs = async () => {
    return (await pb.collection('users').getFullList()).map(e => e.user_id);
}

const handleCreationException = (err) => {
    switch (err.status) {
        default:
            throw new Error(`Error ${err.status} creating database record: ${err.data}`)
    }
}

const handleUpdateException = (err) => {
    switch (err.status) {
        default:
            throw new Error(`Error ${err.status} updating database record: ${err.data}`)
    }
}

const handleFetchException = (err) => {
    switch (err.status) {
        default:
            throw new Error(`Error ${err.status} fetching database record: ${err.data}`)
    }
}

export const validDPExists = async (owner, term) => {
    const d = new Date();
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    d.setMilliseconds(d.getMilliseconds() - WEEK_IN_MILLISECONDS);

    return await pb.collection('datapoints').getFirstListItem(`created >= "${d.toISOString()}" && term="${term}" && owner.id = "${owner}"`)
        .catch(function (err) {
            if (err.status !== 404) {
                console.warn(err);
            }
        });
}

const getUserRecordID = async (user_id) => {
    return (await pb.collection('users').getFirstListItem(`user_id="${user_id}"`)).id
}

export const disableAutoCancel = async () => {
    pb.autoCancellation(false);
}

export const enableAutoCancel = async () => {
    pb.autoCancellation(true);
}

export const deleteLocalData = async (collection, id) => {
    await pb.collection(collection).delete(id);
}

export const getLocalData = async (collection, filter = '', sort = '', page = 1, perPage = 50, autoCancel = true) => {
    return (await pb.collection(collection).getList(page, perPage, {
        filter: filter,
        sort: sort,
        "$autoCancel": autoCancel
    }).catch(handleFetchException)).items;
}

export const getLocalDataByID = async (collection, id, expand = '') => {
    return await pb.collection(collection).getOne(id, {expand: expand}).catch(handleFetchException);
}

export const putLocalData = async (collection, data) => {
    await pb.collection(collection).create(data).catch(handleCreationException);
}

export const updateLocalData = async (collection, data, id) => {
    await pb.collection(collection).update(id, data).catch(handleUpdateException);
}

export const getFullLocalData = async (collection: string, filter = '', sort = '') => {
    return await pb.collection(collection).getFullList({filter: filter, sort: sort}).catch(handleFetchException);
}

export const getPagedLocalData = async (collection: string, perPage: number, page = 0, filter = '', sort = '') => {
    return await pb.collection(collection).getList(page, perPage, {
        filter: filter,
        sort: sort
    }).catch(handleFetchException);
}

export const getAuthData = () => {
    return pb.authStore;
}


export const getDelayedDatapoint = async (user_id, term, delay) => {
    const dps = await pb.collection("datapoints").getList(0, delay + 1, {
        filter: `owner.user_id="${user_id}"&&term="${term}"`,
        sort: '-created'
    }).catch(handleFetchException);
    console.log(dps);
    return dps.items[delay];
}


/**
 *
 * @param user_id A global user ID.
 * @param term
 * @param timeSens Whether or not the datapoint collection should be time sensitive.
 * @returns {Promise<*>} A datapoint object or false.
 */
export const getDatapoint = async (user_id, term, timeSens): Promise<Datapoint | void> => {
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    // Calculate the start boundary time.
    const d1 = new Date();
    d1.setMilliseconds(d1.getMilliseconds() - WEEK_IN_MILLISECONDS);
    // Calculate the end boundary time.
    const d2 = new Date();
    d2.setMilliseconds(d2.getMilliseconds());

    let filter;
    if (timeSens) {
        filter = `owner.user_id="${user_id}"&&term="${term}"&&created>="${d1.toISOString()}"&&created<="${d2.toISOString()}"`;
    } else {
        filter = `owner.user_id="${user_id}"&&term="${term}"`;
    }

    const sort = '-created';


    return await pb.collection('datapoints').getFirstListItem<Datapoint>(
        filter, {
            sort: sort
        })
        .catch(err => {
            if (err.status === 404) {
                console.info(`No datapoints for ${user_id} found for within the last week.`)
            } else (console.warn(err));
        });
}

export const postDatapoint = async (datapoint: Datapoint) => {
    // Check if a valid datapoint already exists.
    const validExists = await validDPExists(datapoint.owner, datapoint.term);
    // If a valid one already exists, don't post.
    if (validExists) {
        console.info(`A valid datapoint already exists for ${datapoint.owner} for the ${datapoint.term} term.`);
        return;
    }
    await pb.collection('datapoints').create(datapoint).catch(handleCreationException);
}

export const subscribe = (collection: string, record: string = '*', sideEffect: Function) => {
    pb.collection(collection).subscribe(record, sideEffect);
}

export const unsubscribe = (collection: string, record: string = '*') => {
    pb.collection(collection).unsubscribe(record);
}
