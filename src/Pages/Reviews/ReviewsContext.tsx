import React, {createContext, useEffect, useState} from 'react';
import {isLoggedIn, retrieveLoggedUserID, retrieveUser} from "@/Tools/users";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {retrievePaginatedReviews, retrieveUnresolvedReviews} from "@/Tools/reviews";
import {ListResult} from "pocketbase";
import {ReviewWithItem} from "@/Tools/Interfaces/reviewInterfaces";
import {useParams} from "react-router-dom";

type Sort = "-created" | "+created" | "-rating" | "+rating";

type ReviewsContextType = {
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    sort: Sort,
    setSort: React.Dispatch<React.SetStateAction<Sort>>,
    paginationLoading: boolean,
    setPaginationLoading: React.Dispatch<React.SetStateAction<boolean>>,
    perPage: number,
    updatePage: (overridePage?: number) => Promise<void>,
    incrementPage: () => Promise<void>,
    decrementPage: () => Promise<void>,
    handlePageChange: (e: React.ChangeEvent<unknown>, value: number) => void,
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleOrderChange: (e: React.ChangeEvent<{ name?: string; value: unknown }>) => void,
    pageID: string,
    isOwnPage: boolean,
    setIsOwnPage: React.Dispatch<React.SetStateAction<boolean>>,
    possessive: string,
    setPossessive: React.Dispatch<React.SetStateAction<string>>,
    pageUser: User,
    setPageUser: React.Dispatch<React.SetStateAction<User>>,
    reviewsPage: ListResult<ReviewWithItem<any>>,
    setReviewsPage: React.Dispatch<React.SetStateAction<ListResult<ReviewWithItem<any>>>>,
    adjacentPages: ListResult<ReviewWithItem<any>>[],
    setAdjacentPages: React.Dispatch<React.SetStateAction<ListResult<ReviewWithItem<any>>[]>>,
    unresolvedReviews: any,
    setUnresolvedReviews: React.Dispatch<React.SetStateAction<any>>,
    isError: boolean,
    setIsError: React.Dispatch<React.SetStateAction<boolean>>,
    errorDetails: { description: string, errCode: string },
    setErrorDetails: React.Dispatch<React.SetStateAction<{ description: string, errCode: string }>>,
    includedTypes: string[],
    setIncludedTypes: React.Dispatch<React.SetStateAction<string[]>>,
    isLoaded: boolean,
    setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
};

export const ReviewsContext = createContext<ReviewsContextType>({
    page: 1,
    setPage: () => {
    },
    sort: "-created",
    setSort: () => {
    },
    paginationLoading: false,
    setPaginationLoading: () => {
    },
    perPage: 10,
    updatePage: async () => {
    },
    incrementPage: async () => {
    },
    decrementPage: async () => {
    },
    handlePageChange: () => {
    },
    handleFilterChange: () => {
    },
    handleOrderChange: () => {
    },
    pageID: '',
    isOwnPage: false,
    setIsOwnPage: () => {
    },
    possessive: '',
    setPossessive: () => {
    },
    pageUser: null,
    setPageUser: () => {
    },
    reviewsPage: null,
    setReviewsPage: () => {
    },
    adjacentPages: null,
    setAdjacentPages: () => {
    },
    unresolvedReviews: null,
    setUnresolvedReviews: () => {
    },
    isError: false,
    setIsError: () => {
    },
    errorDetails: {description: null, errCode: null},
    setErrorDetails: () => {
    },
    includedTypes: ['artists', 'songs', 'albums'],
    setIncludedTypes: () => {
    },
    isLoaded: false,
    setIsLoaded: () => {
    },
});

// Create the provider component
export const ReviewsProvider = ({children}) => {
    const pageID = (useParams()).id;
    const [page, setPage] = useState<number>(1);
    const [sort, setSort] = useState<Sort>("-created");
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [isOwnPage, setIsOwnPage] = useState<boolean>(false);
    const [possessive, setPossessive] = useState<string>('');
    const [pageUser, setPageUser] = useState<User>(null);
    const [reviewsPage, setReviewsPage] = useState<ListResult<ReviewWithItem<any>>>(null);
    const [adjacentPages, setAdjacentPages] = useState<ListResult<ReviewWithItem<any>>[]>(null);
    const [unresolvedReviews, setUnresolvedReviews] = useState(null);
    const [isError, setIsError] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});
    const [includedTypes, setIncludedTypes] = useState(['artists', 'songs', 'albums']);
    const [isLoaded, setIsLoaded] = useState(false);
    const perPage = 10;

    // Function to update the current page with reviews data and adjacent pages
    const updatePage = async (overridePage?: number) => {
        const user = await retrieveUser(pageID);
        setPageUser(user);
        const targetPage = overridePage || page;
        // Retrieve the current page of reviews
        const curr = await retrievePaginatedReviews(user.id, targetPage, perPage, sort);
        setReviewsPage(curr);

        // Retrieve the previous and next pages of reviews, if available
        const prev = targetPage - 1 > 0 ? await retrievePaginatedReviews(pageUser.id, targetPage - 1, perPage, sort) : null;
        const next = targetPage + 1 <= curr.totalPages ? await retrievePaginatedReviews(pageUser.id, targetPage + 1, perPage, sort) : null;

        // Update the adjacent pages with the previous and next page data
        setAdjacentPages([prev, next]);

        // Retrieve unresolved reviews for the user
        const unresolved = await retrieveUnresolvedReviews(user.id);
        setUnresolvedReviews(unresolved);
    };

    // useEffect hook to update reviews page data when the sorting criteria changes
    useEffect(() => {
        updatePage();
    }, [sort]);

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
                const nextPage = await retrievePaginatedReviews(pageUser.id, page + 2, perPage, sort);
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
        if (page - 2 <= 0) {
            // If there is no previous page, set the adjacent pages to [null, nextPage]
            setAdjacentPages([null, nextPage]);
        } else {
            try {
                // Retrieve the previous page of reviews
                const prevPage = await retrievePaginatedReviews(pageUser.id, page - 2, perPage, sort);
                setAdjacentPages([prevPage, nextPage]);
            } catch (error) {
                // Handle error if needed
            }
        }
        // Decrement the current page
        setPage(currPage => currPage - 1);
    };

    const handlePageChange = (e, value) => {
        console.log(value);
        if (value < page) {
            setPaginationLoading(true);
            if (value === page - 1) {
                // To utilise caching.
                decrementPage().then(() => setPaginationLoading(false));
            } else {
                setPage(value);
                updatePage(value).then(() => setPaginationLoading(false));
            }
        } else if (value > page) {
            if (value === page + 1) {
                // To utilise caching.
                incrementPage().then(() => setPaginationLoading(false));
            } else {
                setPage(value);
                updatePage(value).then(() => setPaginationLoading(false));
            }
        }
    }

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

    useEffect(() => {
        const fetchUserReviews = async (id) => {
            const r = await retrievePaginatedReviews(id, 1, perPage, sort);
            console.log(r);
            setReviewsPage(r);
            const a = await retrievePaginatedReviews(id, 2, perPage, sort);
            setAdjacentPages([null, a]);
            const unresolved = await retrieveUnresolvedReviews(id);
            setUnresolvedReviews(unresolved);
        };

        const handleUserRetrievalError = () => {
            setIsError(true);
            setErrorDetails({
                description: "This user's reviews can't be found right now.",
                errCode: "user_is_undefined"
            });
        };

        const handleNotLoggedInError = () => {
            setIsError(true);
            setErrorDetails({
                description: "You must be logged in to view user reviews.",
                errCode: null
            });
        };

        const fetchData = async () => {
            let id = pageID;
            let loggedID = undefined;
            if (isLoggedIn()) {
                loggedID = await retrieveLoggedUserID();
                const u: User = await retrieveUser(id);
                setPageUser(u);
                if (!u) {
                    handleUserRetrievalError();
                } else {
                    await fetchUserReviews(id);
                    if (pageID !== "me") {
                        setPossessive(`${u.display_name}'s`);
                    }
                }
            } else {
                handleNotLoggedInError();
            }
        };

        fetchData().then(() => setIsLoaded(true));
    }, []);


    return (
        <ReviewsContext.Provider value={{
            page,
            setPage,
            sort,
            setSort,
            paginationLoading,
            setPaginationLoading,
            perPage,
            updatePage,
            incrementPage,
            decrementPage,
            handlePageChange,
            handleFilterChange,
            handleOrderChange,
            pageID,
            isOwnPage,
            setIsOwnPage,
            possessive,
            setPossessive,
            pageUser,
            setPageUser,
            reviewsPage,
            setReviewsPage,
            adjacentPages,
            setAdjacentPages,
            unresolvedReviews,
            setUnresolvedReviews,
            isError,
            setIsError,
            errorDetails,
            setErrorDetails,
            includedTypes,
            setIncludedTypes,
            isLoaded,
            setIsLoaded
        }}>
            {children}
        </ReviewsContext.Provider>
    );
};