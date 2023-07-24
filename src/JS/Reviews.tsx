import {useParams} from "react-router-dom";
import {SetStateAction, useEffect, useRef, useState} from "react";
import {
    deleteReview,
    retrieveLoggedUserID,
    retrieveReviews,
    retrieveSearchResults,
    retrieveUser,
    Review,
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
import {capitalize, Checkbox, FormControlLabel, FormGroup} from "@mui/material";
import "./../CSS/Reviews.css";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip,} from 'chart.js';
import StarIcon from '@mui/icons-material/Star';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const ReviewsList = (props: {reviews: Array<Review>, isOwnPage: boolean, setReviews: React.Dispatch<SetStateAction<Array<Review>>>, orderFunc: Function, includedTypes: Array<string>}) => {
    const {reviews, isOwnPage, setReviews, orderFunc, includedTypes} = props;

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
                reviews.filter(r => includedTypes.includes(getItemType(r.item))).sort((a,b) => orderFunc(a,b)).map((r) => {
                    return <ReviewItem key={r.id} review={r} isOwnPage={isOwnPage} handleDelete={handleDelete} />
                })
            }
        </div>
    )
}

const ReviewItem = (props : {review: Review, isOwnPage: boolean, handleDelete: Function}) => {
    const {review, isOwnPage, handleDelete} = props;

    const created = new Date(review.created);
    const edited = new Date(review.updated)
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
                    <div>
                        {created.getTime() !== edited.getTime() &&
                            <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Edited last on <br/> {edited.toDateString()}</p>
                        }
                        <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Reviewed on <br/> {created.toDateString()}</p>
                    </div>
                    {isOwnPage && review.id &&
                        <button className={'subtle-button'} onClick={() => handleDelete(review)}>Delete</button>
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
        const newReview = {item: selectedItem, rating: rating, description: description, created: new Date(), modified: new Date()}
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

const RatingDistribution = (props: {reviews: Array<Review>}) => {
    const {reviews} = props;
    let distribution = [];
    let labels = [];
    for(let i = 0; i <= 5; i += 0.5){
        distribution[i * 2] = 0;
        labels.push(`${i}`);
    }
    reviews.forEach(review => {
        distribution[review.rating * 2]++;
    })
    // Custom CSS variables don't work in the data attribute so this is my workaround.
    const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
    const [bgColor, setBgColor] = useState(
        darkModePreference.matches ?
            [
                'whitesmoke',
            ]
            :
            [
                '#110E09',
            ]
    );
    darkModePreference.addEventListener("change", e => {
        if(e.matches){
            setBgColor(
                [
                    'whitesmoke',
                ]
            )
        }else{
            setBgColor(
                [
                    '#110E09',
                ]
            )
        }
    })
    console.log(distribution);

    const data = {
        labels: labels,
        datasets: [{
            label: 'Ratings',
            data: distribution,
            backgroundColor: bgColor,
            borderWidth: 1
        }]
    };

    const options = {
        categoryPercentage: 1.0,
        barPercentage: 1.0,
        barThickness: 'flex',
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                display: false,
            },
            y: {
              display: false,
            }
        }
    };

    return (
        <div style={{display: 'flex', alignItems: 'end', maxWidth: '100%', height: '200px', overflow: 'hidden'}}>
            <StarIcon fontSize={'small'} />
            <Bar data={data} options={options} />
            <StarIcon fontSize={'small'} />
            <StarIcon fontSize={'small'} />
            <StarIcon fontSize={'small'} />
            <StarIcon fontSize={'small'} />
            <StarIcon fontSize={'small'} />
        </div>
    )
}

const UserDetails = (props : {user: User, possessive: string, reviews: Array<Review>}) => {
    const {user, possessive, reviews} = props;

    return (
        <div>
            <div>
                <p style={{margin: 0}}>Reviews from</p>
                <h2 style={{margin: 0, fontSize: '48px'}}>{user.username}</h2>
                <a className={'subtle-button'} href={`/profile/${user.user_id}`}>View profile</a>
            </div>
            <div>
                <p>asdjsaidunasidnasi</p>
                <RatingDistribution reviews={reviews} />
            </div>
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

    const [includedTypes, setIncludedTypes] = useState(['artists', 'songs', 'albums']);
    const [orderFunc, setOrderFunc] = useState(() => (a,b) => newestFunc(a,b));
    // Ordering functions
    const newestFunc = (a, b) => b.created - a.created;
    const oldestFunc = (a, b) => a.created - b.created;
    const highestRatingFunc = (a, b) => b.rating - a.rating;
    const lowestRatingFunc = (a, b) => a.rating - b.rating;

    function handleFilterChange(e) {
        if(e.target.checked){
            const modified = [...includedTypes, e.target.name];
            setIncludedTypes(modified);
        }else{
            const modified = includedTypes.filter(t => t !== e.target.name);
            setIncludedTypes(modified);
        }
    }

    function handleOrderChange(e) {
        switch (e.target.value) {
            case "newest":
                setOrderFunc(() => (a,b) => newestFunc(a,b));
                break;
            case "oldest":
                setOrderFunc(() => (a,b) => oldestFunc(a,b));
                break;
            case "highestRating":
                setOrderFunc(() => (a,b) => highestRatingFunc(a,b));
                break;
            case "lowestRating":
                setOrderFunc(() => (a,b) => lowestRatingFunc(a,b));
                break;
        }
    }

    return (
        isError ?
                <PageError description={errorDetails.description} errCode={errorDetails.errCode} />
                :
                pageUser ?
                    <div>
                        <UserDetails user={pageUser} possessive={possessive} reviews={reviews} />
                        <div className={'section-header'} style={{marginBottom: '15px'}}>
                            <div style={{maxWidth: '400px'}}>
                                <p style={{
                                    margin: '16px 0 0 0',
                                    textTransform: 'uppercase',
                                }}>{possessive}</p>
                                <h2 style={{margin: '0', textTransform: 'uppercase'}}>Review overview</h2>
                                <p>A look at all of {possessive} reviews. Click on any one of them to explore.</p>
                                {isOwnPage &&
                                    <div style={{display: 'flex', gap: '15px'}}>
                                        <CreateRecommendationForm user_id={pageUser.user_id} reviews={reviews} setReviews={setReviews} />
                                        <ImportForm user_id={pageUser.user_id} setReviews={setReviews} />
                                    </div>
                                }
                            </div>
                            <div className={'mod-section'}>
                                <div>
                                    <p>Item types</p>
                                    <FormGroup>
                                        <FormControlLabel
                                            control={<Checkbox defaultChecked onChange={handleFilterChange} name={"albums"}
                                                               sx={{
                                                                   color: 'var(--secondary-colour)',
                                                                   '&.Mui-checked': {
                                                                       color: 'var(--primary-colour)',
                                                                   },
                                                               }}
                                            />}
                                            label="Albums" />
                                        <FormControlLabel
                                            control={<Checkbox defaultChecked onChange={handleFilterChange} name={"artists"}
                                                               sx={{
                                                                   color: 'var(--secondary-colour)',
                                                                   '&.Mui-checked': {
                                                                       color: 'var(--primary-colour)',
                                                                   },
                                                               }}
                                            />}
                                            label="Artists" />
                                        <FormControlLabel
                                            control={<Checkbox defaultChecked onChange={handleFilterChange} name={"songs"}
                                                               sx={{
                                                                   color: 'var(--secondary-colour)',
                                                                   '&.Mui-checked': {
                                                                       color: 'var(--primary-colour)',
                                                                   },
                                                               }}
                                            />}
                                            label="Songs" />
                                    </FormGroup>
                                </div>
                                <div>
                                    <p>Order</p>
                                    <select defaultValue={"newest"} onChange={handleOrderChange}>
                                        <option value={"newest"}>Newest</option>
                                        <option value={"oldest"}>Oldest</option>
                                        <option value={"highestRating"}>Highest rating</option>
                                        <option value={"lowestRating"}>Lowest rating</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <ReviewsList reviews={reviews} isOwnPage={isOwnPage} setReviews={setReviews} orderFunc={orderFunc} includedTypes={includedTypes} />
                    </div>
                    :
                    <LoadingIndicator />


    )
}

export default Reviews;