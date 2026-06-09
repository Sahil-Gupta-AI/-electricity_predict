import { useState } from "react";
import { link } from "react-router-dom";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";


export default function Sidebar_Menu() {
    const [collapsed, setCollapsed] = useState(false);
return (
  <>
      <div className="layout">
          <aside className={`Sidebar ${collapsed ? "collapsed" : ""}`}>
              <div className="sidebar-header">
                  <img className="logo-pic" src="./logo.png" />
              </div>

              <ul>
                  <li>
                      <a>
                          <House className="logo-button" /> {!collapsed && <span>Dashboard{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <Book className="logo-button" /> {!collapsed && <span>Predict Bills{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <ListVideo className="logo-button" /> {!collapsed && <span>Bill
                          History{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <FileUser className="logo-button" /> {!collapsed && <span>Consumption
                          History{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <Lightbulb className="logo-button" /> {!collapsed && <span>Tips & Suggestions{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <UserPen className="logo-button" /> {!collapsed && <span>Profile{" "}</span>}
                      </a>
                  </li>
                  <li>
                      <a>
                          <LogOut className="logo-button" /> {!collapsed && <span>Logout{" "}</span>}
                      </a>
                  </li>
              </ul>
          </aside>
      </div>
      

 </>

    );
      }