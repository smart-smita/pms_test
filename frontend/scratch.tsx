import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, Sun, Moon, Search, Bell, Maximize, Minimize, ChevronDown, User as UserIcon, Check } from 'lucide-react';
import { apiRequest } from '../../services/api';
