import { useState } from 'react';
import { Plug as PlugIcon, HardDrive, Globe } from 'lucide-react';
import { Plug, Search, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { InfoTooltip } from '../components/shared';
import { PRESET_MCPS } from '../data';

// ── MCP meta ──────────────────────────────────────────────────────────────────

// ── MCP SVG icons ────────────────────────────────────────────────────────────

const MCP_ICONS: Record<string, React.ReactNode> = {
  'GitHub': (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  ),
  'Notion': (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
    </svg>
  ),
  'Slack': (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  ),
  'Google Drive': (
    <svg viewBox="0 1.8 24 20.4" fill="currentColor" width="20" height="20">
      <path d="M0,15.4 L4,22.2 L11.42,9.62 L7.42,2.82 Z"/>
      <path d="M15.31,14.75 L23.31,14.75 L16,1.8 L8,1.8 Z"/>
      <path d="M5.2,21.82 L9.2,15.93 L24,15.93 L20,21.82 Z"/>
    </svg>
  ),
  'Linear': (
    <svg viewBox="3 2.12 18.85 18.88" fill="currentColor" width="20" height="20">
      <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z"/>
      <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z"/>
      <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z"/>
      <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z"/>
    </svg>
  ),
  'Jira': (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.021-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.018 12.49V1.005A1.005 1.005 0 0 0 23.013 0z"/>
    </svg>
  ),
  'Postgres': (
    <svg viewBox="0.5 0 31 32" fill="currentColor" width="20" height="20">
      <path d="M22.839 0c-1.245 0.011-2.479 0.188-3.677 0.536l-0.083 0.027c-0.751-0.131-1.516-0.203-2.276-0.219-1.573-0.027-2.923 0.353-4.011 0.989-1.073-0.369-3.297-1.016-5.641-0.885-1.629 0.088-3.411 0.583-4.735 1.979-1.312 1.391-2.009 3.547-1.864 6.485 0.041 0.807 0.271 2.124 0.656 3.837 0.38 1.709 0.917 3.709 1.589 5.537 0.672 1.823 1.405 3.463 2.552 4.577 0.572 0.557 1.364 1.032 2.296 0.991 0.652-0.027 1.24-0.313 1.751-0.735 0.249 0.328 0.516 0.468 0.755 0.599 0.308 0.167 0.599 0.281 0.907 0.355 0.552 0.14 1.495 0.323 2.599 0.135 0.375-0.063 0.771-0.187 1.167-0.359 0.016 0.437 0.032 0.869 0.047 1.307 0.057 1.38 0.095 2.656 0.505 3.776 0.068 0.183 0.251 1.12 0.969 1.953 0.724 0.833 2.129 1.349 3.739 1.005 1.131-0.24 2.573-0.677 3.532-2.041 0.948-1.344 1.375-3.276 1.459-6.412 0.020-0.172 0.047-0.312 0.072-0.448l0.224 0.021h0.027c1.208 0.052 2.521-0.12 3.62-0.631 0.968-0.448 1.703-0.901 2.239-1.708 0.131-0.199 0.281-0.443 0.319-0.86 0.041-0.411-0.199-1.063-0.595-1.364-0.791-0.604-1.291-0.375-1.828-0.26-0.525 0.115-1.063 0.176-1.599 0.192 1.541-2.593 2.645-5.353 3.276-7.792 0.375-1.443 0.584-2.771 0.599-3.932 0.021-1.161-0.077-2.187-0.771-3.077-2.177-2.776-5.235-3.548-7.599-3.573-0.073 0-0.145 0-0.219 0zM22.776 0.855c2.235-0.021 5.093 0.604 7.145 3.228 0.464 0.589 0.6 1.448 0.584 2.511s-0.213 2.328-0.573 3.719c-0.692 2.699-2.011 5.833-3.859 8.652 0.063 0.047 0.135 0.088 0.208 0.115 0.385 0.161 1.265 0.296 3.025-0.063 0.443-0.095 0.767-0.156 1.105 0.099 0.167 0.14 0.255 0.349 0.244 0.568-0.020 0.161-0.077 0.317-0.177 0.448-0.339 0.509-1.009 0.995-1.869 1.396-0.76 0.353-1.855 0.536-2.817 0.547-0.489 0.005-0.937-0.032-1.319-0.152l-0.020-0.004c-0.147 1.411-0.484 4.203-0.704 5.473-0.176 1.025-0.484 1.844-1.072 2.453-0.589 0.615-1.417 0.979-2.537 1.219-1.385 0.297-2.391-0.021-3.041-0.568s-0.948-1.276-1.125-1.719c-0.124-0.307-0.187-0.703-0.249-1.235-0.063-0.531-0.104-1.177-0.136-1.911-0.041-1.12-0.057-2.24-0.041-3.365-0.577 0.532-1.296 0.88-2.068 1.016-0.921 0.156-1.739 0-2.228-0.12-0.24-0.063-0.475-0.151-0.693-0.271-0.229-0.12-0.443-0.255-0.588-0.527-0.084-0.156-0.109-0.337-0.073-0.509 0.041-0.177 0.145-0.328 0.287-0.443 0.265-0.215 0.615-0.333 1.14-0.443 0.959-0.199 1.297-0.333 1.5-0.496 0.172-0.135 0.371-0.416 0.713-0.828 0-0.015 0-0.036-0.005-0.052-0.619-0.020-1.224-0.181-1.771-0.479-0.197 0.208-1.224 1.292-2.468 2.792-0.521 0.624-1.099 0.984-1.713 1.011-0.609 0.025-1.163-0.281-1.631-0.735-0.937-0.912-1.688-2.48-2.339-4.251s-1.177-3.744-1.557-5.421c-0.375-1.683-0.599-3.037-0.631-3.688-0.14-2.776 0.511-4.645 1.625-5.828s2.641-1.625 4.131-1.713c2.672-0.151 5.213 0.781 5.724 0.979 0.989-0.672 2.265-1.088 3.859-1.063 0.756 0.011 1.505 0.109 2.24 0.292l0.027-0.016c0.323-0.109 0.651-0.208 0.984-0.28 0.907-0.215 1.833-0.324 2.76-0.339zM22.979 1.745h-0.197c-0.76 0.009-1.527 0.099-2.271 0.26 1.661 0.735 2.916 1.864 3.801 3 0.615 0.781 1.12 1.64 1.505 2.557 0.152 0.355 0.251 0.651 0.303 0.88 0.031 0.115 0.047 0.213 0.057 0.312 0 0.052 0.005 0.105-0.021 0.193 0 0.005-0.005 0.016-0.005 0.021 0.043 1.167-0.249 1.957-0.287 3.072-0.025 0.808 0.183 1.756 0.235 2.792 0.047 0.973-0.072 2.041-0.703 3.093 0.052 0.063 0.099 0.125 0.151 0.193 1.672-2.636 2.88-5.547 3.521-8.032 0.344-1.339 0.525-2.552 0.541-3.509 0.016-0.959-0.161-1.657-0.391-1.948-1.792-2.287-4.213-2.871-6.24-2.885zM16.588 2.088c-1.572 0.005-2.703 0.48-3.561 1.193-0.887 0.74-1.48 1.745-1.865 2.781-0.464 1.224-0.625 2.411-0.688 3.219l0.021-0.011c0.475-0.265 1.099-0.536 1.771-0.687 0.667-0.157 1.391-0.204 2.041 0.052 0.657 0.249 1.193 0.848 1.391 1.749 0.939 4.344-0.291 5.959-0.744 7.177-0.172 0.443-0.323 0.891-0.443 1.349 0.057-0.011 0.115-0.027 0.172-0.032 0.323-0.025 0.572 0.079 0.719 0.141 0.459 0.192 0.771 0.588 0.943 1.041 0.041 0.12 0.072 0.244 0.093 0.38 0.016 0.052 0.027 0.109 0.027 0.167-0.052 1.661-0.048 3.323 0.015 4.984 0.032 0.719 0.079 1.349 0.136 1.849 0.057 0.495 0.135 0.875 0.188 1.005 0.171 0.427 0.421 0.984 0.875 1.364 0.448 0.381 1.093 0.631 2.276 0.381 1.025-0.224 1.656-0.527 2.077-0.964 0.423-0.443 0.672-1.052 0.833-1.984 0.245-1.401 0.729-5.464 0.787-6.224-0.025-0.579 0.057-1.021 0.245-1.36 0.187-0.344 0.479-0.557 0.735-0.672 0.124-0.057 0.244-0.093 0.343-0.125-0.104-0.145-0.213-0.291-0.323-0.432-0.364-0.443-0.667-0.937-0.891-1.463-0.104-0.22-0.219-0.439-0.344-0.647-0.176-0.317-0.4-0.719-0.635-1.172-0.469-0.896-0.979-1.989-1.245-3.052-0.265-1.063-0.301-2.161 0.376-2.932 0.599-0.688 1.656-0.973 3.233-0.812-0.047-0.141-0.072-0.261-0.151-0.443-0.359-0.844-0.828-1.636-1.391-2.355-1.339-1.713-3.511-3.412-6.859-3.469zM7.735 2.156c-0.167 0-0.339 0.005-0.505 0.016-1.349 0.079-2.62 0.468-3.532 1.432-0.911 0.969-1.509 2.547-1.38 5.167 0.027 0.5 0.24 1.885 0.609 3.536 0.371 1.652 0.896 3.595 1.527 5.313 0.629 1.713 1.391 3.208 2.12 3.916 0.364 0.349 0.681 0.495 0.968 0.485 0.287-0.016 0.636-0.183 1.063-0.693 0.776-0.937 1.579-1.844 2.412-2.729-1.199-1.047-1.787-2.629-1.552-4.203 0.135-0.984 0.156-1.907 0.135-2.636-0.015-0.708-0.063-1.176-0.063-1.473 0-0.011 0-0.016 0-0.027v-0.005l-0.005-0.009c0-1.537 0.272-3.057 0.792-4.5 0.375-0.996 0.928-2 1.76-2.819-0.817-0.271-2.271-0.676-3.843-0.755-0.167-0.011-0.339-0.016-0.505-0.016zM24.265 9.197c-0.905 0.016-1.411 0.251-1.681 0.552-0.376 0.433-0.412 1.193-0.177 2.131 0.233 0.937 0.719 1.984 1.172 2.855 0.224 0.437 0.443 0.828 0.619 1.145 0.183 0.323 0.313 0.547 0.391 0.745 0.073 0.177 0.157 0.333 0.24 0.479 0.349-0.74 0.412-1.464 0.375-2.224-0.047-0.937-0.265-1.896-0.229-2.864 0.037-1.136 0.261-1.876 0.277-2.751-0.324-0.041-0.657-0.068-0.985-0.068zM13.287 9.355c-0.276 0-0.552 0.036-0.823 0.099-0.537 0.131-1.052 0.328-1.537 0.599-0.161 0.088-0.317 0.188-0.463 0.303l-0.032 0.025c0.011 0.199 0.047 0.667 0.063 1.365 0.016 0.76 0 1.728-0.145 2.776-0.323 2.281 1.333 4.167 3.276 4.172 0.115-0.469 0.301-0.944 0.489-1.443 0.541-1.459 1.604-2.521 0.708-6.677-0.145-0.677-0.437-0.953-0.839-1.109-0.224-0.079-0.457-0.115-0.697-0.109zM23.844 9.625h0.068c0.083 0.005 0.167 0.011 0.239 0.031 0.068 0.016 0.131 0.037 0.183 0.073 0.052 0.031 0.088 0.083 0.099 0.145v0.011c0 0.063-0.016 0.125-0.047 0.183-0.041 0.072-0.088 0.14-0.145 0.197-0.136 0.151-0.319 0.251-0.516 0.281-0.193 0.027-0.385-0.025-0.547-0.135-0.063-0.048-0.125-0.1-0.172-0.157-0.047-0.047-0.073-0.109-0.084-0.172-0.004-0.061 0.011-0.124 0.052-0.171 0.048-0.048 0.1-0.089 0.157-0.12 0.129-0.073 0.301-0.125 0.5-0.152 0.072-0.009 0.145-0.015 0.213-0.020zM13.416 9.849c0.068 0 0.147 0.005 0.22 0.015 0.208 0.032 0.385 0.084 0.525 0.167 0.068 0.032 0.131 0.084 0.177 0.141 0.052 0.063 0.077 0.14 0.073 0.224-0.016 0.077-0.048 0.151-0.1 0.208-0.057 0.068-0.119 0.125-0.192 0.172-0.172 0.125-0.385 0.177-0.599 0.151-0.215-0.036-0.412-0.14-0.557-0.301-0.063-0.068-0.115-0.141-0.157-0.219-0.047-0.073-0.067-0.156-0.057-0.24 0.021-0.14 0.141-0.219 0.256-0.26 0.131-0.043 0.271-0.057 0.411-0.052zM25.495 19.64h-0.005c-0.192 0.073-0.353 0.1-0.489 0.163-0.14 0.052-0.251 0.156-0.317 0.285-0.089 0.152-0.156 0.423-0.136 0.885 0.057 0.043 0.125 0.073 0.199 0.095 0.224 0.068 0.609 0.115 1.036 0.109 0.849-0.011 1.896-0.208 2.453-0.469 0.453-0.208 0.88-0.489 1.255-0.817-1.859 0.38-2.905 0.281-3.552 0.016-0.156-0.068-0.307-0.157-0.443-0.267zM14.787 19.765h-0.027c-0.072 0.005-0.172 0.032-0.375 0.251-0.464 0.52-0.625 0.848-1.005 1.151-0.385 0.307-0.88 0.469-1.875 0.672-0.312 0.063-0.495 0.135-0.615 0.192 0.036 0.032 0.036 0.043 0.093 0.068 0.147 0.084 0.333 0.152 0.485 0.193 0.427 0.104 1.124 0.229 1.859 0.104 0.729-0.125 1.489-0.475 2.141-1.385 0.115-0.156 0.124-0.391 0.031-0.641-0.093-0.244-0.297-0.463-0.437-0.52-0.089-0.043-0.183-0.068-0.276-0.084z"/>
    </svg>
  ),
  'Stripe': (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
    </svg>
  ),
  'Browserbase': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M9 9h6v6H9z" strokeWidth="1.5"/>
    </svg>
  ),
  'Filesystem': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <line x1="12" y1="11" x2="12" y2="17"/>
      <line x1="9" y1="14" x2="15" y2="14"/>
    </svg>
  ),
  'Custom MCP': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
};

const getMcpIcon = (name: string): React.ReactNode =>
  MCP_ICONS[name] ?? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );

const MCP_META: Record<string, { color: string; bg: string }> = {
  'GitHub':       { color: '#24292E', bg: 'rgba(36,41,46,0.10)'    },
  'Notion':       { color: '#000000', bg: 'rgba(0,0,0,0.08)'       },
  'Slack':        { color: '#4A154B', bg: 'rgba(74,21,75,0.10)'    },
  'Google Drive': { color: '#4285F4', bg: 'rgba(66,133,244,0.10)'  },
  'Linear':       { color: '#5E6AD2', bg: 'rgba(94,106,210,0.10)'  },
  'Jira':         { color: '#0052CC', bg: 'rgba(0,82,204,0.10)'    },
  'Postgres':     { color: '#336791', bg: 'rgba(51,103,145,0.10)'  },
  'Stripe':       { color: '#635BFF', bg: 'rgba(99,91,255,0.10)'   },
  'Browserbase':  { color: '#FF6B35', bg: 'rgba(255,107,53,0.10)'  },
  'Filesystem':   { color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
  'Custom MCP':   { color: '#C05640', bg: 'rgba(192,86,64,0.10)'   },
};

const getMcpMeta = (name: string) =>
  MCP_META[name] ?? { color: '#C05640', bg: 'rgba(192,86,64,0.10)' };

// ── helpers ──────────────────────────────────────────────────────────────────

function getWsMcpStatus(mcp: { url: string; apiKey: string; name: string }): 'ready' | 'configuring' | 'unconfigured' {
  const preset = PRESET_MCPS.find(p => p.name === mcp.name);
  const hasUrl = mcp.url.trim() !== '';
  const hasKey = mcp.apiKey.trim() !== '';
  if (!hasUrl && !hasKey) return 'unconfigured';
  if (hasUrl && (!preset?.requiresKey || hasKey)) return 'ready';
  return 'configuring';
}

const statusStyleMap = {
  ready:        { dot: '#2D7D46', label: 'Ready',          bg: 'rgba(45,125,70,0.10)',   color: '#2D7D46' },
  configuring:  { dot: '#F59E0B', label: 'Configuring',    bg: 'rgba(245,158,11,0.10)',  color: '#F59E0B' },
  unconfigured: { dot: '#DC2626', label: 'Not configured', bg: 'rgba(220,38,38,0.10)',   color: '#DC2626' },
};

// ── sub-components ────────────────────────────────────────────────────────────

function AppCatalogCard({
  name,
  desc,
  isAdded,
  onAdd,
}: {
  name: string;
  desc: string;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const meta = getMcpMeta(name);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
      style={{
        width: 160,
        background: hovered ? meta.bg : 'var(--bg-surface)',
        border: `1.5px solid ${hovered ? meta.color + '55' : 'var(--border-color)'}`,
        boxShadow: hovered ? `0 4px 16px ${meta.color}22` : 'var(--shadow-sm)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {getMcpIcon(name)}
        </div>
        {isAdded && (
          <span
            className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(45,125,70,0.12)', color: '#2D7D46' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
            Active
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="font-display font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
          {name}
        </p>
        <p className="font-body text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          {desc}
        </p>
      </div>

      <button
        onClick={() => !isAdded && onAdd()}
        disabled={isAdded}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-default"
        style={{
          background: isAdded ? 'rgba(45,125,70,0.08)' : hovered ? meta.color : 'var(--bg-elevated)',
          color: isAdded ? '#2D7D46' : hovered ? '#fff' : meta.color,
          border: `1px solid ${isAdded ? 'rgba(45,125,70,0.25)' : hovered ? meta.color : meta.color + '44'}`,
        }}
      >
        {isAdded ? (
          <><CheckCircle2 size={12} /> Added</>
        ) : (
          <><Plus size={12} /> Add</>
        )}
      </button>
    </div>
  );
}

// ── Accordion row ─────────────────────────────────────────────────────────────

function AppRow({
  mcp,
  isOpen,
  onToggle,
  onRemove,
  onUpdate,
}: {
  mcp: { id: string; name: string; url: string; apiKey: string };
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (field: 'url' | 'apiKey', value: string) => void;
}) {
  const meta = getMcpMeta(mcp.name);
  const preset = PRESET_MCPS.find(p => p.name === mcp.name);
  const status = getWsMcpStatus(mcp);
  const sm = statusStyleMap[status];
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${isOpen ? meta.color + '44' : 'var(--border-color)'}`,
        background: 'var(--bg-surface)',
        boxShadow: isOpen ? `0 4px 20px ${meta.color}18` : 'var(--shadow-sm)',
      }}
    >
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150"
        style={{ background: isOpen ? meta.bg : 'transparent' }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {getMcpIcon(mcp.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {mcp.name}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: sm.bg, color: sm.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.dot }} />
              {sm.label}
            </span>
            {preset?.requiresKey && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}
              >
                API Key
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {mcp.url || preset?.urlPlaceholder || 'No URL set'}
          </p>
        </div>

        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded config drawer */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2" style={{ borderTop: `1px solid ${meta.color}22` }}>
          <div className="flex items-center justify-end mb-5">
            <button
              onClick={() => { if (window.confirm('Remove this MCP server?')) onRemove(); }}
              className="p-1.5 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="section-label mb-1.5 block" style={{ fontSize: 10 }}>
                Server URL <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                className="form-input w-full font-mono text-sm"
                placeholder={preset?.urlPlaceholder ?? 'https://your-mcp-server.com'}
                value={mcp.url}
                onChange={e => onUpdate('url', e.target.value)}
              />
            </div>

            {preset?.requiresKey && (
              <div>
                <label className="section-label mb-1.5 block" style={{ fontSize: 10 }}>
                  API Key <span style={{ color: '#DC2626' }}>*</span>
                  <span
                    className="ml-2 px-1 py-0.5 rounded text-[8px] font-semibold uppercase"
                    style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}
                  >
                    secret
                  </span>
                </label>
                <div className="relative">
                  <input
                    className="form-input w-full pr-10 font-mono text-sm"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-••••••••••••••••"
                    value={mcp.apiKey}
                    onChange={e => onUpdate('apiKey', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New App Modal ─────────────────────────────────────────────────────────────

function NewAppModal({
  addedNames,
  onClose,
  onAdd,
}: {
  addedNames: string[];
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const isCustom = selected === 'Custom MCP';
  const canSubmit = !!selected && (isCustom ? customName.trim() !== '' : true);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd(isCustom ? customName.trim() : selected!);
    setSelected(null);
    setCustomName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(45,42,38,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Add MCP Server
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Type grid */}
          <div>
            <label className="section-label mb-2 block">Server Type</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MCPS.map(p => {
                const meta = getMcpMeta(p.name);
                const isAdded = addedNames.includes(p.name);
                const isSelected = selected === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => { if (!isAdded) setSelected(p.name); }}
                    disabled={isAdded}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: `1.5px solid ${isSelected ? meta.color : 'var(--border-color)'}`,
                      background: isSelected ? meta.bg : 'var(--bg-elevated)',
                    }}
                    onMouseEnter={e => {
                      if (!isAdded && !isSelected)
                        e.currentTarget.style.borderColor = meta.color + '55';
                    }}
                    onMouseLeave={e => {
                      if (!isAdded && !isSelected)
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {getMcpIcon(p.name)}
                    </div>
                    <span
                      className="font-mono text-[9px] font-semibold text-center leading-tight"
                      style={{ color: isSelected ? meta.color : 'var(--text-muted)' }}
                    >
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom name input (only when Custom MCP selected) */}
          {isCustom && (
            <div>
              <label className="section-label mb-1.5 block">Server Name</label>
              <input
                className="form-input w-full"
                placeholder="e.g. My Internal API"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--burnt-orange)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-full text-sm font-semibold text-white brand-gradient disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: canSubmit ? '0 4px 12px rgba(192,86,64,0.25)' : 'none' }}
          >
            Add Server
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AppsPage() {
  const { workspaces, updateWorkspace } = useStore();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace ?? workspaces[0];

  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const mcps = activeWs?.mcps ?? [];
  const addedNames = mcps.map(m => m.name);

  const addWsMcp = (name: string) => {
    if (!activeWs) return;
    if (mcps.find(m => m.name === name)) return;
    updateWorkspace(activeWs.id, {
      mcps: [...mcps, { id: 'mcp-' + Date.now(), name, url: '', apiKey: '' }],
    });
    setOpenId(name);
  };

  const removeWsMcp = (name: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, {
      mcps: mcps.filter(m => m.name !== name),
    });
    if (openId === name) setOpenId(null);
  };

  const updateWsMcpField = (name: string, field: 'url' | 'apiKey', value: string) => {
    if (!activeWs) return;
    updateWorkspace(activeWs.id, {
      mcps: mcps.map(m => (m.name === name ? { ...m, [field]: value } : m)),
    });
  };

  const toggleRow = (name: string) =>
    setOpenId(prev => (prev === name ? null : name));

  const filtered = mcps.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.url.toLowerCase().includes(search.toLowerCase())
  );

  const readyCount = mcps.filter(m => getWsMcpStatus(m) === 'ready').length;
  const needsConfigCount = mcps.filter(m => getWsMcpStatus(m) !== 'ready').length;

  if (!activeWs) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Zone 0: Sticky Header ── */}
      <div
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-10 py-4 flex-shrink-0"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="w-full flex items-center justify-between gap-4">
          <div>
            <p className="section-label mb-0">setup</p>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                Apps
              </h1>
              <InfoTooltip content="Apps connect MCP servers to your workspace, giving agents access to external tools and data sources like GitHub, Notion, Slack, and more." />
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient flex-shrink-0"
            style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.25)' }}
          >
            <Plus size={16} /> <span>Add App</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        {/* ── Zone 1: Stats Bar ── */}
        {mcps.length > 0 && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Total Apps',
                  value: mcps.length,
                  icon: <Plug size={16} style={{ color: 'var(--burnt-orange)' }} />,
                },
                {
                  label: 'Ready',
                  value: readyCount,
                  icon: <CheckCircle2 size={16} style={{ color: '#2D7D46' }} />,
                },
                {
                  label: 'Needs Config',
                  value: needsConfigCount,
                  icon: <AlertCircle size={16} style={{ color: '#F59E0B' }} />,
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,86,64,0.08)' }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </p>
                    <p className="font-mono text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Zone 2: Catalog Strip ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <p className="section-label mb-0">available servers</p>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              {PRESET_MCPS.length}
            </span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {PRESET_MCPS.map(p => (
              <AppCatalogCard
                key={p.name}
                name={p.name}
                desc={p.desc}
                isAdded={addedNames.includes(p.name)}
                onAdd={() => addWsMcp(p.name)}
              />
            ))}
          </div>
        </section>

        {/* ── Zone 3: Connected Apps ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <p className="section-label mb-0">connected apps</p>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {mcps.length}
              </span>
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                className="form-input pl-8 text-sm"
                style={{ padding: '8px 12px 8px 32px', fontSize: 13 }}
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ border: '1.5px dashed var(--border-color)', background: 'var(--bg-surface)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(192,86,64,0.08)' }}
              >
                <Plug size={24} style={{ color: 'var(--burnt-orange)' }} />
              </div>
              <p className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                No MCP servers connected
              </p>
              <p className="font-body text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
                Pick a server from the catalog above to get started.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white brand-gradient"
                style={{ boxShadow: '0 4px 12px rgba(192,86,64,0.20)' }}
              >
                <Plus size={15} /> Add your first app
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(mcp => (
                <AppRow
                  key={mcp.name}
                  mcp={mcp}
                  isOpen={openId === mcp.name}
                  onToggle={() => toggleRow(mcp.name)}
                  onRemove={() => removeWsMcp(mcp.name)}
                  onUpdate={(field, value) => updateWsMcpField(mcp.name, field, value)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── New App Modal ── */}
      {modalOpen && (
        <NewAppModal
          addedNames={addedNames}
          onClose={() => setModalOpen(false)}
          onAdd={name => addWsMcp(name)}
        />
      )}
    </div>
  );
}
