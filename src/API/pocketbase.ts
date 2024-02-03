import PocketBase, {Record, RecordSubscription} from "pocketbase";
import {DatabaseUser} from "@/Tools/Interfaces/databaseInterfaces";
import {DatapointRecord, Term} from "@/Tools/Interfaces/datapointInterfaces";

// TODO: MUST ADD HEADERS TO SEND db_id SO IT CAN BE CHECKED SERVER SIDE

/**
 * Creates a new instance of PocketBase.
 * @returns {PocketBase} A new PocketBase instance.
 */
export const createNewPBInstance = (): PocketBase => {
    const instance = new PocketBase("https://harked.pockethost.io/");
    instance.beforeSend = function(url, options) {
        options.headers['db_id'] = window.localStorage.getItem('db_id');
        return {url, options}
    }
    return instance;
}

const pb = createNewPBInstance();

/**
 * Gets the first list item with a matching user id.
 * @param {string} user_id The user's global user ID.
 * @returns {Promise<DatabaseUser | void>} A user object.
 */
export const getDatabaseUser = async (user_id): Promise<DatabaseUser | void> => {
    return await pb.collection('users').getFirstListItem<DatabaseUser>(`user_id="${user_id}"`)
        .catch(
            function (err) {
                console.warn("Error getting user: ");
                console.warn(err);
            }
        );
}

/**
 * Will return all the user IDs in the database.
 * @returns {Promise<Array<string>>} An array of user IDs.
 */
export const getAllUserIDs = async (): Promise<Array<string>> => {
    return (await pb.collection('users').getFullList()).map(e => e.user_id);
}

// Exception handlers for different operations
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

/**
 * Checks if a valid datapoint exists within the last week.
 * @param {string} owner The owner's ID.
 * @param {string} term The term to check.
 * @returns {Promise<boolean>} True if a valid datapoint exists, false otherwise.
 */
export const validDPExists = async (owner: string, term: Term) => {
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

/**
 * Gets the record ID of a user.
 * @param {string} user_id The user's global user ID.
 * @returns {Promise<string>} The user's record ID.
 */
const getUserRecordID = async (user_id) => {
    return (await pb.collection('users').getFirstListItem(`user_id="${user_id}"`)).id
}

/**
 * Disables auto cancellation of requests.
 */
export const disableAutoCancel = async () => {
    pb.autoCancellation(false);
}

/**
 * Enables auto cancellation of requests.
 */
export const enableAutoCancel = async () => {
    pb.autoCancellation(true);
}

/**
 * Deletes a record from a collection.
 * @param {string} collection The collection to delete from.
 * @param {string} id The ID of the record to delete.
 */
export const deleteLocalData = async (collection, id) => {
    await pb.collection(collection).delete(id);
}

export const getLocalData = async <T>(collection, filter = '', sort = '', page = 1, perPage = 50, autoCancel = true) => {
    return (await pb.collection(collection).getList<T>(page, perPage, {
        filter: filter,
        sort: sort,
        "$autoCancel": autoCancel
    }).catch(handleFetchException)).items;
}

export const getLocalDataByID = async <T>(collection, id, expand = '') => {
    return await pb.collection(collection).getOne<T>(id, {expand: expand}).catch(handleFetchException);
}

export const putLocalData = async (collection, data) => {
    await pb.collection(collection).create(data).catch(handleCreationException);
}

export const updateLocalData = async (collection, data, id) => {
    await pb.collection(collection).update(id, data).catch(handleUpdateException);
}
//TODO: HAS MAX OF 200 RECORDS per submission
export const getFullLocalData = async <T>(collection: string, filter = '', sort = '') => {
    return await pb.collection(collection).getFullList<T>({filter: filter, sort: sort}).catch(handleFetchException);
}

export const getPagedLocalData = async <T>(collection: string, perPage: number, page = 0, filter = '', sort = '') => {
    return await pb.collection(collection).getList<T>(page, perPage, {
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
    return dps.items[delay];
}


/**
 *
 * @param user_id A global user ID.
 * @param term
 * @param timeSens Whether or not the datapoint collection should be time sensitive.
 * @returns {Promise<*>} A datapoint record or false.
 */
export const getDatapointRecord = async (user_id, term, timeSens): Promise<DatapointRecord | void> => {
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


    return await pb.collection('datapoints').getFirstListItem<DatapointRecord>(
        filter, {
            sort: sort
        })
        .catch(err => {
            if (err.status === 404) {
                console.info(`No datapoints for ${user_id} found for within the last week.`)
            } else (console.warn(err));
        });
}

export const postDatapointRecord = async (record: Omit<DatapointRecord, "id" | "created" | "updated">) => {
    // Check if a valid datapoint already exists.
    const validExists = await validDPExists(record.owner, record.term);
    // If a valid one already exists, don't post.
    if (validExists) {
        console.info(`A valid datapoint already exists for ${record.owner} for the ${record.term} term.`);
        return;
    }
    await pb.collection('datapoints').create(record).catch(handleCreationException);
}

export const subscribe = async (collection: string, record: string = '*', sideEffect: (data: RecordSubscription<Record>) => void) => {
    await pb.collection(collection).subscribe(record, sideEffect);
}

export const unsubscribe = async (collection: string, record: string = '*') => {
    await pb.collection(collection).unsubscribe(record);
}
