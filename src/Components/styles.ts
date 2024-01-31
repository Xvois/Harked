import {Pagination, Rating, Select, styled, TextField} from "@mui/material";

export const StyledField = styled(TextField)({
    "& .MuiInputBase-root": {
        background: 'rgba(125, 125, 125, 0.1)',
        color: 'var(--primary-colour)'
    },
    '& .MuiInput-underline': {
        color: `var(--secondary-colour)`,
    },
    '& .MuiFormLabel-root.Mui-disabled': {
        color: `var(--secondary-colour)`,
    },
    '& .MuiInput-underline:after': {
        borderBottomColor: 'var(--accent-colour)',
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'rgba(125, 125, 125, 0.2)',
            borderRadius: `0px`,
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'rgba(125, 125, 125, 0.2)',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'rgba(125, 125, 125, 0.2)',
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
    },
    '& label.Mui-focused': {
        color: 'var(--primary-colour)',
        fontFamily: 'Inter Tight, sans-serif',
    },
    '& .MuiFormLabel-root': {
        color: 'var(--primary-colour)',
        marginLeft: `5px`,
        fontFamily: 'Inter Tight, sans-serif',
    },
});

export const StyledSelect = styled(Select)({
    "& .MuiSelect-select": {
        background: 'rgba(125, 125, 125, 0.1)',
        color: 'var(--primary-colour)'
    },
    "& .MuiSelect-icon": {
        color: 'var(--primary-colour)'
    },
    "& .MuiSelect-outlined": {
        border: '1px solid rgba(125, 125, 125, 0.25)',
        '& .Mui-focused': {
            border: '1px solid rgba(125, 125, 125, 1)',
        }
    },
})


export const StyledRating = styled(Rating)({
    '& .MuiRating-iconEmpty': {
        color: 'var(--secondary-colour)',
    },
    '& .MuiRating-iconFilled': {
        color: 'var(--primary-colour)',
    },
    '& .MuiRating-iconHover': {
        color: 'var(--primary-colour)',
    },
});

export const StyledPagination = styled(Pagination)({
    '& .MuiButtonBase-root': {
        color: 'var(--primary-colour)',
        background: 'var(--transparent-colour)',
        borderColor: 'var(--transparent-border-colour)',
    },
    '& .MuiPaginationItem-ellipsis': {
        color: 'var(--primary-colour)'
    },
    '& .Mui-selected': {
        backgroundColor: 'var(--transparent-border-colour)'
    }
})