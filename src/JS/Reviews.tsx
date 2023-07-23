import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {
    Album,
    Artist,
    deleteReview,
    Record,
    retrieveLoggedUserID,
    retrieveReviews,
    retrieveSearchResults,
    retrieveUser,
    Song,
    submitReview,
    User
} from "./HDM.ts";
import {
    LoadingIndicator,
    PageError,
    SelectionModal,
    SimpleModal,
    StyledField,
    StyledRating,
    ValueIndicator
} from "./SharedComponents.tsx";
import {getItemType, getLIDescription, getLIName} from "./Analysis";
import {capitalize} from "@mui/material";
import "./../CSS/Reviews.css";

interface Review extends Record {
    description: string,
    item: Artist | Song | Album | {id: string, type: string},
    owner: string,
    rating: number
}

const ReviewsList = (props: {reviews: Array<Review>, isOwnPage: boolean, setReviews: React.SetStateAction<Array<Review>>}) => {
    const {reviews, isOwnPage, setReviews} = props;

    const handleDelete = (e) => {
        if(window.confirm(`Are you sure you want to delete your review of ${getLIName(e.item)}?`)) {
            deleteReview(e.id).then(() => {
                const removed = reviews.filter(r => r.id !== e.id);
                setReviews(removed);
            });
        }
    }


    return (
        <div className={'review-list'}>
            {
                reviews.map((r,i) => {
                    return <ReviewItem key={r.id} review={r} isOwnPage={isOwnPage} handleDelete={handleDelete} />
                })
            }
        </div>
    )
}

const ReviewItem = (props : {review: Review, isOwnPage: boolean, handleDelete: Function}) => {
    const {review, isOwnPage, handleDelete} = props;

    const created = new Date(review.created);
    const type = getItemType(review.item);


    return (
        <div className={'review-wrapper'} style={{position: 'relative', width: 'max-content'}}>
            <a style={{position: 'absolute', width: '100%', height: '85%', top: 0, left: 0}} href={`/review/some_id`} />
            <img style={{width: '100%', height: '150px', objectFit: 'cover', bottom: 0}} className={'backdrop-image'} alt={getLIName(review.item)} src={review.item.image} />
            <div className={'review-heading'}>
                <div>
                    <p style={{margin: 0, color: 'var(--secondary-colour)'}}>{capitalize(type.slice(0, type.length - 1))}</p>
                    <a className={'heavy-link'} href={review.item.link} style={{margin: 0}}>{getLIName(review.item)}</a>
                    <p style={{margin: 0}}>{getLIDescription(review.item)}</p>
                    <StyledRating
                        readOnly
                        value={review.rating}
                        precision={0.5}
                    />
                </div>
                <div style={{display: "flex", justifyContent: 'space-between', alignItems: 'end', width: '100%'}}>
                    <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Reviewed on <br/> {created.toDateString()}</p>
                    {isOwnPage && review.id &&
                        <button style={{zIndex: '2'}} className={'subtle-button'} onClick={() => handleDelete(review)}>Delete</button>
                    }
                </div>
            </div>
        </div>
    )
}

const CreateRecommendationForm = (props: {user_id: string, reviews, setReviews}) => {
    const {user_id, reviews, setReviews} = props;

    const [showModal, setShowModal] = useState(false);

    const handleSubmit = async (selectedItem, type, description, rating) => {
        await submitReview(user_id, selectedItem, type, rating, description);
        const newReview = {item: selectedItem, rating: rating, description: description, created: new Date()}
        setReviews([newReview, ...reviews]);
    }

    return (
        <div>
            <button className={'subtle-button'} onClick={() => setShowModal(true)}>Add review</button>
            <SelectionModal
                showModal={showModal}
                setShowModal={setShowModal}
                onSubmit={handleSubmit}
                description
                rating
            />
        </div>
    )
}

const UserDetails = (props : {user: User}) => {
    const {user} = props;

    return (
        <div>
            <p style={{margin: 0}}>Reviews from</p>
            <a href={`/profile/${user.user_id}`} className={'heavy-link'} style={{margin: 0, fontSize: '48px'}}>{user.username}</a>
        </div>
    )
}

const ImportForm = (props: {user_id: string, setReviews}) => {
    const {user_id, setReviews} = props;
    const [completed, setCompleted] = useState(0);
    const [numOfItems, setNumOfItems] = useState(undefined);
    const [processing, setProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const tableRef = useRef('');

    const importFromRYM = async () => {
        setProcessing(true);
        console.log(tableRef.current.value);
        const data = parseTable(tableRef.current.value);
        setNumOfItems(data.length);
        // Function to resolve promises in batches
        async function resolveInBatches(promises, batchSize) {
            const results = [];

            for (let i = 0; i < promises.length; i += batchSize) {
                const batchPromises = promises.slice(i, i + batchSize);
                const batchResults = await Promise.all(batchPromises);
                results.push(batchResults);
            }

            return results.flat();
        }

        // Assuming retrieveSearchResults returns a Promise
        const batchSize = 50;
        const searchResultsPromises = data.map((d) =>
            retrieveSearchResults(d.title, "albums", 1)
        );

        const searchResults = await resolveInBatches(searchResultsPromises, batchSize);
        const items = searchResults.flat();
        const reviews = items.map((item, index) => { return {item: item, rating: data[index].rating} });

        for (const review of reviews) {
            await submitReview(user_id, review.item, "albums", review.rating, '');

            // Use the previous state updater form of setCompleted
            setCompleted(prevCompleted => prevCompleted + 1);

        }
        setProcessing(false);
        setIsOpen(false);
        const newReviews = await retrieveReviews(user_id);
        setReviews(newReviews);
    }

    const parseTable = (data) => {
        const parsed = [];

        // Split the data into lines
        const lines = data.split('\n');

        // Extract the headings to identify the positions of Release and Rating columns
        const headings = lines[1].split('\t');
        const releaseIndex = headings.indexOf("Release");
        const ratingIndex = headings.indexOf("Rating");

        // Loop through the data starting from the third line (index 2) to avoid the headers
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].split('\t');
            const release = line[releaseIndex] || ""; // Use an empty string if the release index is missing
            const rating = line[ratingIndex] || ""; // Use an empty string if the rating index is missing

            // Check if both Release and Rating are present before logging
            if (release && rating) {
                parsed.push({title: release, rating: rating})
            }
        }
        return parsed;
    }

    return (
        <>
            <button className={'subtle-button'} onClick={() => setIsOpen(true)}>Import ratings from RateYourMusic</button>
            <SimpleModal id={'import-modal'} showModal={isOpen} setShowModal={setIsOpen}>
                {processing ?
                    <div style={{height: '400px'}}>
                        <div className={'centre'}>
                            <ValueIndicator value={Math.round((completed / numOfItems) * 100)} />
                        </div>
                    </div>
                    :
                    <div>
                        <h2>Import ratings from RateYourMusic</h2>
                        <p>On RYM, click on your own ratings then 'print this page'. <br/> Press Ctrl-A and then Ctrl-C and paste the contents in to the box below to import.</p>
                        <p>Track ratings will not be imported.</p>
                        <p style={{fontWeight: 'bold'}}>This should only ever be done once.</p>
                        <StyledField
                            variant='outlined'
                            multiline
                            inputRef={tableRef}
                            rows={5}
                        />
                        <button className={'subtle-button'} style={{marginLeft: 'auto'}} onClick={importFromRYM}>Import</button>
                    </div>
                }
            </SimpleModal>
        </>
    )
}

const Reviews = () => {
    const pageID = (useParams()).id;
    const isOwnPage = pageID === "me";
    const [possessive, setPossessive] = useState('');
    const [pageUser, setPageUser] = useState(null);
    const [reviews, setReviews] = useState(null);
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});

    useEffect(() => {
        const fetchData = async () => {
            let user_id = pageID;
            console.log(pageID);

            if(pageID === "me"){
                setPossessive('your');
                user_id = await retrieveLoggedUserID();
            }
            const u : User = await retrieveUser(user_id);
            if(!u){
                setIsError(true);
                setErrorDetails({description: "This user's reviews can't be found right now.", errCode: "user_is_undefined"})
            }else{
                const r = await retrieveReviews(user_id);
                if(pageID !== "me"){
                    setPossessive(`${u.username}'s`)
                }
                setPageUser(u);
                setReviews(r);
                console.log(r);
            }
        };

        fetchData();

    }, []);

    return (
        isError ?
                <PageError description={errorDetails.description} errCode={errorDetails.errCode} />
                :
                pageUser ?
                    <div>
                        <UserDetails user={pageUser} />
                        <div className={'section-header'} style={{marginBottom: '15px'}}>
                            <div style={{maxWidth: '400px'}}>
                                <p style={{
                                    margin: '16px 0 0 0',
                                    textTransform: 'uppercase'
                                }}>{possessive}</p>
                                <h2 style={{margin: '0', textTransform: 'uppercase'}}>Review overview</h2>
                                <p>A look at all of {possessive} reviews. Click on any one of them to explore.</p>
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <CreateRecommendationForm user_id={pageUser.user_id} reviews={reviews} setReviews={setReviews} />
                                    <ImportForm user_id={pageUser.user_id} setReviews={setReviews} />
                                </div>
                            </div>
                        </div>
                        <ReviewsList reviews={reviews} isOwnPage={isOwnPage} setReviews={setReviews} />
                    </div>
                    :
                    <LoadingIndicator />


    )
}

export default Reviews;