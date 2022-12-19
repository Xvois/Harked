import "./../CSS/Feedback.css"
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import BugReportIcon from '@mui/icons-material/BugReport';

const Feedback = () => {
    return (
        <>
            <div style={{display: 'flex', flexDirection: 'row', marginTop: '50px'}}>
                <div style={{width: '50%'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <ChatBubbleIcon fontSize="medium" />
                        <h2 style={{marginTop: '0'}}>General Feedback</h2>
                    </div>
                    <div style={{textAlign: 'center', padding: '0 20px 20px 20px', fontFamily: 'Inter Tight'}}>
                        <p>General feedback includes any suggestions, ideas or general preferences in regards to the site. Any ideas that you believe would improve
                            the general experience of the site is greatly appreciated. I ask that you be as specific as possible when talking about your feedback. The more specific, the better! </p>
                        <a style={{color: 'white'}} href=''>Please submit your feedback here.</a>
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
                        <a style={{color: 'white'}} href=''>Please submit your bug reports here.</a>
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