import "./../CSS/Feedback.css"
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import BugReportIcon from '@mui/icons-material/BugReport';
import BlurOnIcon from '@mui/icons-material/BlurOn';

const Feedback = () => {
    return (
        <>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px'}}>
                <BlurOnIcon fontSize="medium" />
                <h2 style={{marginTop: '0'}}>Beta Survey</h2>
            </div>
            <div style={{textAlign: 'center', padding: '0 20px 20px 20px', fontFamily: 'Inter Tight', width: '50%', margin: 'auto'}}>
                <p>If you have had the chance to use the site for a while and experience both logging in and using your own profile as well as comparing it to others then you filling out this survey would be invaluable.</p>
                <p>Your opinions would be greatly appreciated and help my coursework evaluation of my project.</p>
                <a style={{color: 'white'}} href={'https://forms.office.com/Pages/ResponsePage.aspx?id=vaSGHkF4vkyPb-p6BQ_FApzhPPePyoxArvz6EgYy7KpURElWQTFCWExHVkxLV1NRUkkyTTY1TUlLUC4u'}>Please fill out the survey here.</a>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{width: '50%'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <ChatBubbleIcon fontSize="medium" />
                        <h2 style={{marginTop: '0'}}>General Feedback</h2>
                    </div>
                    <div style={{textAlign: 'center', padding: '0 20px 20px 20px', fontFamily: 'Inter Tight'}}>
                        <p>General feedback includes any suggestions, ideas or general preferences in regards to the site. Any ideas that you believe would improve
                            the general experience of the site are greatly appreciated. I ask that you be as specific as possible when talking about your feedback. The more specific, the better! </p>
                        <a style={{color: 'white'}} href='https://forms.office.com/Pages/ResponsePage.aspx?id=vaSGHkF4vkyPb-p6BQ_FApzhPPePyoxArvz6EgYy7KpUM0dFQUU1OVMyTzNYOTNZV01EWFNHVVhUVS4u'>Please submit your feedback here.</a>
                    </div>
                </div>
                <div style={{width: '50%'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <BugReportIcon fontSize="medium" />
                        <h2 style={{marginTop: '0'}}>Bug Report</h2>
                    </div>
                    <div style={{textAlign: 'center', padding: '0 20px 20px 20px', fontFamily: 'Inter Tight'}}>
                        <p>If you encounter an issue with the site of any form then a bug report can be crucial to fixing it and ensuring the site works well for everyone. These reports can be a little
                        more involved than the general feedback forms, but this makes sure that I can tackle them as quickly as possible.</p>
                        <a style={{color: 'white'}} href='https://forms.office.com/Pages/ResponsePage.aspx?id=vaSGHkF4vkyPb-p6BQ_FApzhPPePyoxArvz6EgYy7KpUQ1NSWk9WOTlBRjBLS0hCNDVGVENXU1JWSy4u'>Please submit your bug reports here.</a>
                    </div>
                </div>
            </div>
            <div style={{textAlign: 'center', padding: '0 20px 20px 20px', fontFamily: 'Inter Tight', fontWeight: 'bold'}}>
                <p>Please be aware that anything you write may be used in my coursework document to help provide evidence.</p>
                <p>Thank you for your help!</p>
            </div>
        </>

    )
}

export default Feedback;