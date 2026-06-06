import { Link } from 'react-router-dom';
import '../styles/home.css';
import { useState } from "react";
import { House } from 'lucide-react';
import { Book } from 'lucide-react';
import { ListVideo } from 'lucide-react';
import { FileUser } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { UserPen } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Menu } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { ClockFading } from 'lucide-react';
import { StepBack } from 'lucide-react';
import { FileDown } from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';

export default function home() {
    const [collapsed, setCollapsed] = useState(false);
  return (
    <>



    <div className="layout">
    <aside className={`Sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className='sidebar-header'>
            <img className='logo-pic' src="./logo.png" />
        </div>

     <ul>
        <li><a><House className='logo-button' /> Dashboard </a></li>
        <li><a><Book className='logo-button'/> Predict Bills </a></li>
        <li><a><ListVideo className='logo-button' /> Bill History</a></li>
        <li><a><FileUser className='logo-button' /> Consumption History </a></li>
        <li><a><Lightbulb className='logo-button'/> Tips & Suggestions</a></li>
        <li><a><UserPen className='logo-button'/> Profile </a></li>
        <li><a><LogOut className='logo-button'/> Logout </a></li>
     </ul>
        </aside>
      <div className='main-content'>
      <header className='top-navbar'>
        <div className='navbar'>
        
          <div className='menu' onClick={() => setCollapsed(!collapsed)} >
            <Menu />
          </div>
          <div className="profile">
            <div className="avatar">A</div>
           Amit Kumar
           <ChevronDown />
         </div>
         </div>
         </header>

     <main className='content'>
      <h2>Dashboard</h2>
      <div className="first-row">
        <div className="first-row-box">
            <div className="first-row-box-icon" id='blue'><ClockFading color='#637be1' className='box-icon'/></div>
           <div className='first-row-box-box'>
            <p className='box-text'>Last Month Units</p>
            <p className='box-units'>320 KWh</p>
            <p className='box-date'>May 2026</p>
            </div>
        </div>
        <div className="first-row-box" >
            <div className="first-row-box-icon" id='green'><StepBack color='#2ebc7f' className='box-icon'/></div>
            <div className='first-row-box-box'>
            <p className='box-text'>Last Month Bills</p>
            <p className='box-price'>₹2,450</p>
            <p className='box-date'>May 2026</p>
            </div>
        </div>
        <div className="first-row-box">
            <div className="first-row-box-icon" id='orange'><FileDown color='#f8b537'className='box-icon'/></div>
            <div className='first-row-box-box'>
            <p className='box-text'>Predicted Month Units</p>
            <p className='box-units'>350 KWh</p>
            <p className='box-date'>June 2026</p>
            </div>
        </div>
        <div className="first-row-box">
            <div className="first-row-box-icon" id='purple'><FileSpreadsheet color='#995cf1' className='box-icon'/></div>
            <div className='first-row-box-box'>
            <p className='box-text'>Predicted Month Bills</p>
            <p className='box-price'>₹2,730</p>
            <p className='box-date'>June 2026</p>
            </div>
        </div>
      </div>
    </main>
    </div>
     
     
</div>
    
    </>
  );
}