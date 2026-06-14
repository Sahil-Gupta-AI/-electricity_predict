import { Link } from "react-router-dom";
import "../styles/Sidebar_Menu.css";
import { House } from "lucide-react";
import { Book } from "lucide-react";
import { ListVideo } from "lucide-react";
import { FileUser } from "lucide-react";
import { Lightbulb } from "lucide-react";
import { UserPen } from "lucide-react";
import { LogOut } from "lucide-react";
import PredictBillPage from "./PredictBillPage";

export default function Sidebar_Menu({ collapsed, setCollapsed }) {
    
return (
  <>
      <aside className={`Sidebar ${collapsed ? "collapsed" : ""}`}>
              <div className="sidebar-header">
                  <img className="logo-pic" src="./logo.png" />
              </div>

              <ul>
                  <li>
                    <Link to="/home" className="sidebar-link">
                      <House className="logo-button" /> 
                      {!collapsed && <span>Dashboard</span>}
                    </Link>
                  </li>
                  <li>
                    <Link to="/predictbill" className="sidebar-link">
                      <Book className="logo-button" /> 
                      {!collapsed && <span>Predict Bills</span>}
                    </Link>
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
                  
              </ul>
          </aside>
 </>

    );
      }