import React from 'react';

const Footer = () => {
 return (
   <footer className="theme-surface theme-text py-12 border-t theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between">
          <div className="w-full sm:w-auto mb-8 sm:mb-0">
            <h2 className="text-2xl font-bold mb-4 mt-5"><img src='logo.png' className='w-16 h-auto relative flex'/>EVOLVE - YouTube Analyzer</h2>
            <p className="theme-muted">Analyze YouTube videos to get insights and recommendations.</p>
          </div>
          <div className="w-full sm:w-auto transition ease-linear">
            <h3 className="text-lg font-semibold mb-4 mt-5">Contact Us</h3>
            <div className="flex flex-col">
              <a href="mailto:gaddamwaranurag@gmail.com" className="theme-link">
                <i className="fas fa-envelope"></i>
                <span className="ml-2">Email: gaddamwaranurag@gmail.com</span>
              </a>
              <a href="tel:+918080172824" className="theme-link">
                <i className="fas fa-phone"></i>
                <span className="ml-2">Phone:+91 8080172824</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8 space-x-4">
          <a href="#" className="theme-link">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="theme-link">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="theme-link">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="theme-link">
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>
        <div className="text-center mt-8">
          <p className="theme-muted">Made by Anurag Gaddamwar</p>
          <p className="theme-muted">© 2024 EVOLVE. All rights reserved.</p>
        </div>
      </div>
    </footer>
 );
};

export default Footer;
