# Photon

This is a project I created for my Computer Science A-Level NEA.

**For those examining, please note that this repo is set up so that the main branch is the project as it is sent for examination. This version (V 1.0.15) is legacy and will not work without hosting your own database using the below scripts and making subsequent modifications to the API endpoints within API.js. Hosted [here](https://bhasvic-photon.vercel.app/) is the V 1.1.0 branch which expands upon this legacy version.**

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

### `node server.js`

This will host the API on localhost:9000. This project automatically points to photon-database.tk/PRDB as this is where the live database is hosted.

**Note: Versions greater than V 1.1.0 are not backwards compatible due to modifications to how datapoints are accessed, so those hosting versions beneath that will need to host their own database to access.**

### `node db.js`

This will create the PRDB within the route server/db/database.db

It is a SQLite 3 relational database and can be accessed using the API endpoints routed in dbRoutes.js.

