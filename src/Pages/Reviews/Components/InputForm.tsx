import React, {useRef, useState} from "react";
import {retrieveSearchResults} from "@/Tools/search";
import {getLIName} from "@/Analysis/analysis";
import {submitReview} from "@/Tools/reviews";
import {SimpleModal} from "@/Components/SimpleModal";
import {ValueIndicator} from "@/Components/ValueIndicator";
import {StyledField} from "@/Components/styles";

const ImportForm = (props: { user_id: string, updatePage: Function }) => {
    const {user_id, updatePage} = props;
    const [completed, setCompleted] = useState(0);
    const [numOfItems, setNumOfItems] = useState(undefined);
    const [processing, setProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const tableRef = useRef<HTMLTextAreaElement | null>(null);

    const importFromRYM = async () => {
        setProcessing(true);
        let data;
        if (tableRef.current) {
            data = parseTable(tableRef.current.value);
        } else {
            return;
        }
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
            retrieveSearchResults(d.title + " " + d.artist, "album", 1)
        );

        const searchResults = await resolveInBatches(searchResultsPromises, batchSize);
        const items = searchResults.flat();
        const reviews = items.map((item, index) => {
            if (getLIName(item) === data[index].title) {
                return {item: item, rating: data[index].rating}
            }
        });

        for (const review of reviews) {
            await submitReview(review.item, review.rating, '');
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

export default ImportForm;