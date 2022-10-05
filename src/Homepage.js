
import './Homepage.css';

function Homepage() {
  return (
    <div className="Homepage">
      <header className="Homepage-header">
        <img className="photon-logo" src={require('./PhotonLogo.png')} alt="Photon logo"></img>
        <div className = "element-container">
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Search</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Profile</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Settings</p>
        </div>
      </header>
      <div className="Homepage-body">
        <h1 className="main-text">Get true insights on your Spotify profile</h1>
        <a className="auth-button" href=''>Log-in with Spotify</a>
      </div>
    </div>
  );
}

export default Homepage;
