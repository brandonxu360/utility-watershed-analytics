import './SmallScreenNotice.css';

export default function SmallScreenNotice(): JSX.Element {
    return (
        <div className="small-screen-notice">
            <div>
                <h1 id="small-screen-title" className="small-screen-title">Best viewed on larger screens</h1>
                <p className="small-screen-body">
                    This experience is optimized for tablets and desktops. For the clearest maps, charts, and controls, please use a device with a wider display.
                </p>
            </div>
        </div>
    );
}
