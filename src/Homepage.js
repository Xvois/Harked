
import './Homepage.css';

function Homepage() {
  return (
    <div className="Homepage">
      <div className="Homepage-header">
        <img className="photon-logo" src={require('./PhotonLogo.png')} alt="Photon logo"></img>
        <div className = "elementContainer">
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Search</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Profile</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Settings</p>
        </div>
      </div>
    </div>
  );
}

export default Homepage;
