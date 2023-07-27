import {useParams} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {
    deleteReview,
    isLoggedIn,
    retrieveLoggedUserID,
    retrievePaginatedReviews,
    retrieveSearchResults,
    retrieveUnresolvedReviews,
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const ReviewsList = (props: {
    reviews: Array<Review>,
    isOwnPage: boolean,
    includedTypes: Array<string>,
    updatePage: Function
}) => {
    const {reviews, isOwnPage, includedTypes, updatePage} = props;

    const handleDelete = (e) => {
        if (window.confirm(`Are you sure you want to delete your review of ${getLIName(e.item)}?`)) {
            deleteReview(e.id).then(() => updatePage());
        }
    }

    return (
        <div className={'review-list'}>
            {reviews !== undefined ?
                reviews.filter(r => includedTypes.includes(getItemType(r.item))).map((r) => {
                    return <ReviewItem key={r.id} review={r} isOwnPage={isOwnPage} handleDelete={handleDelete}/>
                })
                :
                <>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                    <div className={'placeholder'} style={{width: '330px', height: '330px', flexGrow: '1'}}/>
                </>
            }
        </div>
    )
}

const ReviewItem = (props: { review: Review, isOwnPage: boolean, handleDelete: Function }) => {
    const {review, isOwnPage, handleDelete} = props;

    const created = new Date(review.created);
    const edited = new Date(review.updated)
    const type = getItemType(review.item);


    return (
        <div className={'review-wrapper'} style={{position: 'relative', width: 'max-content'}}>
            {review.id &&
                <a style={{position: 'absolute', width: '100%', height: '85%', top: 0, left: 0}}
                   href={`/review/${review.id}`}/>
            }
            <img loading={"lazy"} style={{width: '100%', height: '150px', objectFit: 'cover', bottom: 0}}
                 className={'backdrop-image'} alt={getLIName(review.item)} src={review.item.image}/>
            <div className={'review-heading'}>
                <div>
                    <p style={{
                        margin: 0,
                        color: 'var(--secondary-colour)'
                    }}>{capitalize(type.slice(0, type.length - 1))}</p>
                    <a className={'heavy-link'} href={review.item.link} style={{margin: 0}}>{getLIName(review.item)}</a>
                    <p style={{margin: 0}}>{getLIDescription(review.item)}</p>
                    <StyledRating
                        readOnly
                        value={review.rating}
                        precision={0.5}
                    />
                    {review.description &&
                        <p style={{
                            whiteSpace: 'pre-line',
                            maxHeight: '140px',
                            overflow: 'hidden',
                            marginBottom: 0
                        }}>{review.description.length > 170 ? review.description.slice(0, 170) + "..." : review.description}</p>
                    }
                </div>
                <div style={{display: "flex", justifyContent: 'space-between', alignItems: 'end', width: '100%'}}>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                        {created.getTime() !== edited.getTime() &&
                            <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Edited last
                                on <br/> {edited.toDateString()}</p>
                        }
                        <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Reviewed
                            on <br/> {created.toDateString()}</p>
                    </div>
                    {isOwnPage && review.id &&
                        <button className={'subtle-button'} onClick={() => handleDelete(review)}>Delete</button>
                    }
                </div>
            </div>
        </div>
    )
}

const CreateRecommendationForm = (props: { user_id: string, reviews: Review[], updatePage: Function}) => {
    const {user_id, reviews, updatePage} = props;

    const [showModal, setShowModal] = useState(false);

    const handleSubmit = async (selectedItem, type, description, rating) => {
        await submitReview(user_id, structuredClone(selectedItem), type, rating, description)
            .catch((e) => {
                console.error(e);
            });
        updatePage();
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

const RatingDistribution = (props: { reviews: Array<Review> }) => {
    const {reviews} = props;
    let distribution = [];
    let labels = [];
    for (let i = 0; i <= 5; i += 0.5) {
        distribution[i * 2] = 0;
        labels.push(`${i}`);
    }
    if (reviews) {
        reviews.forEach(review => {
            distribution[review.rating * 2]++;
        })
    }
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
        if (e.matches) {
            setBgColor(
                [
                    'whitesmoke',
                ]
            )
        } else {
            setBgColor(
                [
                    '#110E09',
                ]
            )
        }
    });

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
            },
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
        <div style={{display: 'flex', alignItems: 'end', height: '100%'}}>
            <div style={{height: '71px'}}>
                {reviews &&
                    <Bar data={data} options={options}/>
                }
            </div>
        </div>
    )
}

const UserDetails = (props: { user: User, possessive: string, numOfReviews: number, isOwnPage: boolean }) => {
    const {user, possessive, numOfReviews, isOwnPage} = props;

    return (
        <div className='user-container' style={{marginBottom: '25px', width: 'max-content', maxWidth: '100%'}}>
            <div style={{display: 'flex', flexDirection: 'row', maxHeight: '150px', gap: '15px'}}>
                {user.profile_picture && (
                    <div className={'profile-picture'}>
                        <img alt={'profile picture'} className={'levitating-image'} src={user.profile_picture}
                             style={{height: '100%', width: '100%', objectFit: 'cover'}}/>
                    </div>
                )}
                <div className={'user-details'}>
                    <p style={{margin: '0 0 -5px 0'}}>Reviews from</p>
                    <a className={'heavy-link'} href={`/profile/${user.user_id}`}
                       style={{fontSize: '30px', wordBreak: 'break-all'}}>
                        {user.username}
                    </a>
                    {numOfReviews !== undefined && numOfReviews !== null ?
                        <p style={{margin: 0}}><span style={{fontWeight: 'bold'}}>{numOfReviews}</span> reviews</p>
                        :
                        <p style={{margin: 0}}><span style={{fontWeight: 'bold'}}>Loading</span> reviews</p>
                    }
                </div>
            </div>
        </div>
    )
}


const ImportForm = (props: { user_id: string, updatePage: Function}) => {
    const {user_id, updatePage} = props;
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
        const batchSize = 50;
        const searchResultsPromises = data.map((d) =>
            retrieveSearchResults(d.title + " " + d.artist, "albums", 1)
        );

        const searchResults = await resolveInBatches(searchResultsPromises, batchSize);
        const items = searchResults.flat();
        const reviews = items.map((item, index) => {
            if(getLIName(item) === data[index].title){
                return {item: item, rating: data[index].rating}
            }
        });

        for (const review of reviews) {
            await submitReview(user_id, review.item, "albums", review.rating, '');
            // Use the previous state updater form of setCompleted
            setCompleted(prevCompleted => prevCompleted + 1);

        }
        setProcessing(false);
        setIsOpen(false);
        updatePage();
    }

    const parseTable = (data) => {
        const parsed = [];

        // Split the data into lines
        const lines = data.split('\n');

        // Extract the headings to identify the positions of Release and Rating columns
        const headings = lines[1].split('\t');
        const releaseIndex = headings.indexOf("Release");
        const ratingIndex = headings.indexOf("Rating");
        const artistIndex = headings.indexOf("Artist");

        // Loop through the data starting from the third line (index 2) to avoid the headers
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].split('\t');
            const release = line[releaseIndex] || ""; // Use an empty string if the release index is missing
            const rating = line[ratingIndex] || ""; // Use an empty string if the rating index is missing
            const artist = line[artistIndex] || "";

            // Check if both Release and Rating are present before logging
            if (release && rating && artist) {
                parsed.push({title: release, rating: rating, artist: artist});
            }
        }
        console.log(parsed);
        return parsed;
    }

    return (
        <>
            <button className={'subtle-button'} onClick={() => setIsOpen(true)}>Import ratings from RYM</button>
            <SimpleModal id={'import-modal'} showModal={isOpen} setShowModal={setIsOpen}>
                {processing ?
                    <div style={{height: '400px'}}>
                        <div className={'centre'}>
                            <ValueIndicator value={Math.round((completed / numOfItems) * 100)}/>
                        </div>
                    </div>
                    :
                    <div>
                        <h2>Import ratings from RateYourMusic</h2>
                        <p>On RYM, click on your own ratings then 'print this page'. <br/> Press Ctrl-A and then Ctrl-C
                            and paste the contents in to the box below to import.</p>
                        <p>Track ratings will not be imported.</p>
                        <p style={{fontWeight: 'bold'}}>This should only ever be done once.</p>
                        <StyledField
                            fullWidth
                            inputRef={tableRef}
                            rows={4}
                            multiline
                        />
                        <div style={{display: 'flex', justifyContent: 'right'}}>
                            <button className="std-button"
                                    style={{
                                        background: 'rgba(125, 125, 125, 0.1)',
                                        borderColor: 'rgba(125, 125, 125, 0.2)',
                                        borderTop: "none"
                                    }} onClick={importFromRYM}>
                                Import
                            </button>
                        </div>
                    </div>
                }
            </SimpleModal>
        </>
    )
}

interface PaginationButtonsProps {
    page: number;
    totalPages: number;
    onDecrement: () => Promise<void>;
    onIncrement: () => Promise<void>;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({ page, totalPages, onDecrement, onIncrement }) => {
    const [loading, setLoading] = useState(false);

    const handleDecrement = async () => {
        setLoading(true);
        await onDecrement();
        setLoading(false);
    };

    const handleIncrement = async () => {
        setLoading(true);
        await onIncrement();
        setLoading(false);
    };

    return (
        <div style={{display: 'flex', gap: '20px', alignItems: 'center', width: 'max-content'}}>
            <button className={'subtle-button'} style={{background: 'none'}} disabled={loading || page <= 1} onClick={handleDecrement}>
                {"<"}-
            </button>
            <p>
                {page} / {totalPages}
            </p>
            <button className={'subtle-button'} style={{background: 'none'}} disabled={loading || page >= totalPages} onClick={handleIncrement}>
                -{">"}
            </button>
        </div>
    );
};

const Reviews = () => {
    const pageID = (useParams()).id;
    const isOwnPage = pageID === "me";
    const [possessive, setPossessive] = useState('');
    const [pageUser, setPageUser] = useState(null);
    const [reviewsPage, setReviewsPage] = useState(null);
    const [adjacentPages, setAdjacentPages] = useState(null);
    const [unresolvedReviews, setUnresolvedReviews] = useState(null);
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState("-created");
    const perPage = 20;

    // Function to update the current page with reviews data and adjacent pages
    const updatePage = async () => {
        // Retrieve the current page of reviews
        const curr = await retrievePaginatedReviews(pageUser.user_id, page, perPage, sort);
        setReviewsPage(curr);

        // Retrieve the previous and next pages of reviews, if available
        const prev = page - 1 > 0 ? await retrievePaginatedReviews(pageUser.user_id, page - 1, perPage, sort) : null;
        const next = page + 1 <= curr.totalPages ? await retrievePaginatedReviews(pageUser.user_id, page + 1, perPage, sort) : null;

        // Update the adjacent pages with the previous and next page data
        setAdjacentPages([prev, next]);

        // Retrieve unresolved reviews for the user
        const unresolved = await retrieveUnresolvedReviews(pageUser.user_id);
        setUnresolvedReviews(unresolved);
    };

    // Function to increment the page and load the next page of reviews
    const incrementPage = async () => {
        const prevPage = reviewsPage;
        setReviewsPage(adjacentPages[1]);
        if (page + 2 > reviewsPage.totalPages) {
            // If there is no next page, set the adjacent pages to [prevPage, null]
            setAdjacentPages([prevPage, null]);
        } else {
            try {
                // Retrieve the next page of reviews
                const nextPage = await retrievePaginatedReviews(pageUser.user_id, page + 2, perPage, sort);
                setAdjacentPages([prevPage, nextPage]);
            } catch (error) {
                // Handle error if needed
            }
        }
        // Increment the current page
        setPage(currPage => currPage + 1);
    };

    // Function to decrement the page and load the previous page of reviews
    const decrementPage = async () => {
        const nextPage = reviewsPage;
        setReviewsPage(adjacentPages[0]);
        if (page - 2 < 0) {
            // If there is no previous page, set the adjacent pages to [null, nextPage]
            setAdjacentPages([null, nextPage]);
        } else {
            try {
                // Retrieve the previous page of reviews
                const prevPage = await retrievePaginatedReviews(pageUser.user_id, page - 2, perPage, sort);
                setAdjacentPages([prevPage, nextPage]);
            } catch (error) {
                // Handle error if needed
            }
        }
        // Decrement the current page
        setPage(currPage => currPage - 1);
    };

    // useEffect hook to update reviews page data when the sorting criteria changes
    useEffect(() => {
        updatePage();
    }, [sort]);

    // useEffect hook to fetch data for the user's reviews on component mount
    useEffect(() => {
        const fetchData = async () => {
            let user_id = pageID;
            let loggedID = undefined;
            if (isLoggedIn()) {
                loggedID = await retrieveLoggedUserID();
                if (loggedID === user_id) {
                    window.location.href = '/reviews/me';
                }
            }

            if (pageID === "me") {
                setPossessive('your');
                user_id = loggedID;
            }
            const u: User = await retrieveUser(user_id);
            setPageUser(u);
            if (!u) {
                setIsError(true);
                setErrorDetails({
                    description: "This user's reviews can't be found right now.",
                    errCode: "user_is_undefined"
                });
            } else {
                // Retrieve and set the initial data for reviews and unresolved reviews
                const r = await retrievePaginatedReviews(user_id, 1, perPage, sort);
                setReviewsPage(r);
                const a = await retrievePaginatedReviews(user_id, 2, perPage, sort);
                setAdjacentPages([null, a]);
                const unresolved = await retrieveUnresolvedReviews(user_id);
                setUnresolvedReviews(unresolved);
                console.log(unresolved);
                if (pageID !== "me") {
                    setPossessive(`${u.username}'s`);
                }
            }
        };

        // Fetch data for the user's reviews on component mount
        fetchData();

    }, []);


    const [includedTypes, setIncludedTypes] = useState(['artists', 'songs', 'albums']);

    function handleFilterChange(e) {
        if (e.target.checked) {
            const modified = [...includedTypes, e.target.name];
            setIncludedTypes(modified);
        } else {
            const modified = includedTypes.filter(t => t !== e.target.name);
            setIncludedTypes(modified);
        }
    }

    function handleOrderChange(e) {
        switch (e.target.value) {
            case "newest":
                setSort("-created")
                break;
            case "oldest":
                setSort("+created")
                break;
            case "highestRating":
                setSort("-rating")
                break;
            case "lowestRating":
                setSort("+rating")
                break;
        }
    }

    return (
        isError ?
            <PageError {...errorDetails} />
            :
            pageUser ?
                <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                        <UserDetails user={pageUser} possessive={possessive} numOfReviews={reviewsPage?.totalItems}
                                     isOwnPage={isOwnPage}/>
                        <RatingDistribution reviews={unresolvedReviews}/>
                    </div>
                    <div className={'section-header review-section-heading'} style={{marginBottom: '15px'}}>
                        <div style={{maxWidth: '400px'}}>
                            <p style={{
                                margin: '16px 0 0 0',
                                textTransform: 'uppercase',
                            }}>{possessive}</p>
                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Review overview</h2>
                            <p>A look at all of {possessive} reviews. Click on any one of them to explore.</p>
                            {isOwnPage &&
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <CreateRecommendationForm user_id={pageUser.user_id} reviews={reviewsPage?.items} updatePage={updatePage} />
                                    <ImportForm user_id={pageUser.user_id} updatePage={updatePage}/>
                                </div>
                            }
                        </div>
                        {reviewsPage?.items.length > 0 && reviewsPage !== null &&
                            <div className={'mod-section'}>
                                <div>
                                    <p>Order</p>
                                    <select defaultValue={"newest"} onChange={handleOrderChange}>
                                        <option value={"newest"}>Newest</option>
                                        <option value={"oldest"}>Oldest</option>
                                        <option value={"highestRating"}>Highest rating</option>
                                        <option value={"lowestRating"}>Lowest rating</option>
                                    </select>
                                </div>
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
                                            label="Albums"/>
                                        <FormControlLabel
                                            control={<Checkbox defaultChecked onChange={handleFilterChange} name={"artists"}
                                                               sx={{
                                                                   color: 'var(--secondary-colour)',
                                                                   '&.Mui-checked': {
                                                                       color: 'var(--primary-colour)',
                                                                   },
                                                               }}
                                            />}
                                            label="Artists"/>
                                        <FormControlLabel
                                            control={<Checkbox defaultChecked onChange={handleFilterChange} name={"songs"}
                                                               sx={{
                                                                   color: 'var(--secondary-colour)',
                                                                   '&.Mui-checked': {
                                                                       color: 'var(--primary-colour)',
                                                                   },
                                                               }}
                                            />}
                                            label="Songs"/>
                                    </FormGroup>
                                </div>
                            </div>
                        }
                    </div>
                    {reviewsPage && reviewsPage?.totalPages > 1 && (
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '15px'}}>
                            <PaginationButtons
                                page={page}
                                totalPages={reviewsPage.totalPages}
                                onDecrement={decrementPage}
                                onIncrement={incrementPage}
                            />
                        </div>
                    )}
                    {reviewsPage?.items.length > 0 || reviewsPage === null ?
                        <ReviewsList reviews={reviewsPage?.items} isOwnPage={isOwnPage} includedTypes={includedTypes} updatePage={updatePage}/>
                        :
                        <p style={{color: 'var(--secondary-colour)'}}>Looks like there aren't any reviews yet.</p>
                    }
                </div>
                :
                <LoadingIndicator/>
    )
}

export default Reviews;