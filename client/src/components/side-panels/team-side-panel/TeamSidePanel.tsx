const scrollToUniversity = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    const id = name.replace(/\s+/g, '_');
    const element = document.getElementById(id);
    
    if (element) {
        // Find the scrolling parent
        let scrollContainer = element.parentElement;
        while (scrollContainer) {
            const hasOverflow = window.getComputedStyle(scrollContainer).overflow;
            if (hasOverflow === 'auto' || hasOverflow === 'scroll' || 
                scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                break;
            }
            scrollContainer = scrollContainer.parentElement;
        }
        
        console.log('Actual scroll container:', scrollContainer);
        
        if (scrollContainer) {
            const navbarHeight = 60;
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
            const offsetPosition = relativeTop - navbarHeight;
            
            scrollContainer.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
}

export default function TeamSidePanelContent() {
    return (
      <div className="team-panel">
        <h2>Project Team & Partners</h2>
        <p>
          Select from the following to see our team of experts and partner institutions:
        </p>
        <br />
        <button
            className='actionButton'
            aria-label='Washington State University'
            title='Washington State University'
            id='wsu'
            onClick={(e) => scrollToUniversity(e, "Washington_State_University")}
        >
            Washington State University
        </button>
        <button
            className='actionButton'
            aria-label='University of Idaho'
            title='University of Idaho'
            id='ui'
            onClick={(e) => scrollToUniversity(e, "University_of_Idaho")}
        >
            University of Idaho
        </button>
        <button
            className='actionButton'
            aria-label='University of Nevada, Reno'
            title='University of Nevada, Reno'
            id='unr'
            onClick={(e) => scrollToUniversity(e, "University_of_Nevada,_Reno")}
        >
            University of Nevada, Reno
        </button>
        <button
            className='actionButton'
            aria-label='Oregon State University'
            title='Oregon State University'
            id='osu'
            onClick={(e) => scrollToUniversity(e, "Oregon_State_University")}
        >
            Oregon State University
        </button>
        <button
            className='actionButton'
            aria-label='US Forest Service'
            title='US Forest Service'
            id='usfs'
            onClick={(e) => scrollToUniversity(e, "US_Forest_Service,_Rocky_Mtn_Research_Station")}
        >
            US Forest Service
        </button>
        <button
            className='actionButton'
            aria-label='Partners'
            title='Partners'
            id='partners'
            onClick={(e) => scrollToUniversity(e, "partner_section")}
        >
            Partners
        </button>
        
        <br /><br />

      </div>
    )
}
  