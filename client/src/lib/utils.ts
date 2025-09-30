import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getTimeSince(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  let interval = seconds / 31536000; // seconds in a year
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000; // seconds in a month
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400; // seconds in a day
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600; // seconds in an hour
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60; // seconds in a minute
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

export function getPeriodLabel(period: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  switch (period) {
    case 'week':
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
    case 'month':
      return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `Q${quarter} ${year}`;
    case 'year':
      return `${year}`;
    default:
      return period;
  }
}

export function getRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#0ea5e9', // sky
    '#14b8a6', // teal
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280', // gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getStatusColor(status: string): {bg: string, text: string} {
  switch (status.toLowerCase()) {
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'pending':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'completed':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'failed':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' };
  }
}
