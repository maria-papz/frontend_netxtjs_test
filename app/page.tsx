"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {  Sixtyfour } from 'next/font/google';
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useAppSelector } from '@/redux/hooks';
import useVerify from '@/hooks/use-verify';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const sixty_four = Sixtyfour({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});
import {
  Database,
  BarChart3,
  Workflow,
  Shield,
  GitBranch,
  Search,
  Users,
  PlayCircle,
  TableIcon,
  Target
} from "lucide-react";

const contentSections = [
	{
		id: "overview",
		title: "Overview",
		icon: Target,
		content: "KOE DB (CYPERC DB) is the Economics Research Centre's central repository for time‑series economic indicators used or produced by the Centre, providing a single source of truth for research workflows, reproducible analysis, and collaborative data management."
	},
	{
		id: "why",
		title: "Why a centralised database",
		icon: Database,
		content: "By consolidating indicators in one place, the platform standardises metadata, ensures consistent versions across projects, streamlines updates, and reduces duplication. This way, researchers can focus on analysis rather than data wrangling."
	},
	{
		id: "indicators",
		title: "Indicators",
		icon: BarChart3,
		content: "Indicators are time‑series measures such as CPI, GDP, rates, or custom series created by the Centre; each indicator carries rich metadata (frequency, units, source, geography, time coverage) and supports controlled access, favourites, and activity history."
	},
	{
		id: "tables",
		title: "Tables",
		icon: TableIcon,
		content: "Tables let you assemble multiple indicators into reusable views; align frequencies and save curated tables to share with collaborators or reuse across projects."
	},
	{
		id: "workflows",
		title: "Workflows",
		icon: Workflow,
		content: "Automated workflows connect to Eurostat, CYSTAT, and the ECB to fetch, map, and update indicators on schedules you define; runs are validated, logged, and versioned, with run history and status to keep datasets current with minimal effort."
	},
	{
		id: "permissions",
		title: "Permissions",
		icon: Shield,
		content: "Access is managed at the indicator level with view, edit, and delete capabilities; users with edit access can grant or revoke permissions for others, enabling secure, granular sharing across teams and projects."
	},
	{
		id: "provenance",
		title: "Provenance and history",
		icon: GitBranch,
		content: "Every important change is captured in action logs and indicator history, showing who changed what and when; you can review versions and, where applicable, restore prior data to ensure reproducibility."
	},
	{
		id: "search",
		title: "Search and discovery",
		icon: Search,
		content: "Quickly find indicators and tables by name, code, source, frequency, unit, country, or tags; user profiles are searchable, and names and emails are visible within the platform to facilitate collaboration."
	},
	{
		id: "collaboration",
		title: "Collaboration",
		icon: Users,
		content: "Follow colleagues, favourite indicators and tables, and view activity feeds for the items and people you care about, making it easy to track updates and build shared analytical assets."
	},
	{
		id: "getting-started",
		title: "Getting started",
		icon: PlayCircle,
		content: "Sign in to explore available indicators, create or join tables, configure workflows for automated updates, and invite collaborators with the appropriate permissions to build a robust, shared evidence base."
	}
];

function ContentSection({ section, index }: { section: typeof contentSections[0], index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.7 });
  const Icon = section.icon;

  return (
    <div
      ref={ref}
      className="h-screen relative"
    >
      <motion.div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full px-8 text-center"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isInView ? 1 : 0
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          zIndex: isInView ? 15 : 1
        }}
      >
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-md">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        <motion.h2
          className="text-xl font-semibold mb-4 text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {section.title}
        </motion.h2>

        <motion.p
          className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {section.content}
        </motion.p>

        <motion.div
          className="mt-6 flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 0.8 : 0.3 }}
          transition={{ duration: 0.2 }}
        >
          {contentSections.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'bg-secondary' : 'bg-muted-foreground/40'
              }`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function ScrollingContent() {
  return (
    <div className="relative">
      {contentSections.map((section, index) => (
        <ContentSection key={section.id} section={section} index={index} />
      ))}
    </div>
  );
}export default function Home() {
	// Use proper auth verification hook
	useVerify();

	const { isLoading, isAuthenticated } = useAppSelector(state => state.auth);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		// Add a small delay to prevent flash of unstyled content
		if (!isLoading) {
			setTimeout(() => setIsLoaded(true), 100);
		}
	}, [isLoading]);

	// Redirect if authenticated
	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			redirect('/dashboard');
		}
	}, [isLoading, isAuthenticated]);

	// Show loading while auth is being verified
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-3"></div>
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	// Show loading state during initial render
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-background">
				{/* Show just the header while loading */}
				<header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
					<div className="container mx-auto px-8 py-4 flex justify-between items-center">
						<div className="flex items-center space-x-3">
							<Image
								src="/images/University_of_Cyprus.svg"
								width={24}
								height={24}
								alt="University of Cyprus Logo"
								className="h-6 w-6"
							/>
							<div className="flex flex-col">
								<span className="text-lg font-bold text-foreground">KOE Insights Lab</span>
								<span className="text-xs text-muted-foreground">Database for CypERC</span>
							</div>
						</div>

						<nav className="flex items-center space-x-4">
							<Link
								href="/auth/login"
								className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Login
							</Link>
							<Link
								href="/auth/register"
								className="px-4 py-2 text-sm bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors"
							>
								Register
							</Link>
							<Link
								href="/privacy"
								className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Privacy
							</Link>
						</nav>
					</div>
				</header>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Fixed Theme Toggle - Bottom Right */}
			<div className="fixed bottom-6 right-6 z-50">
				<ThemeToggle />
			</div>

			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
				<div className="container mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<Image
							src="/images/University_of_Cyprus.svg"
							width={24}
							height={24}
							alt="University of Cyprus Logo"
							className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
						/>
						<div className="flex flex-col">
							<span className="text-sm sm:text-lg font-bold text-foreground">KOE Insights Lab</span>
							<span className="text-xs text-muted-foreground hidden sm:block">Database for CypERC</span>
						</div>
					</div>

					<nav className="hidden sm:flex items-center space-x-4">
						<Link
							href="/auth/login"
							className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Login
						</Link>
						<Link
							href="/auth/register"
							className="px-4 py-2 text-sm bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors"
						>
							Register
						</Link>
						<Link
							href="/privacy"
							className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Privacy
						</Link>
					</nav>

					{/* Mobile menu */}
					<div className="flex sm:hidden items-center space-x-2">
						<Link
							href="/auth/login"
							className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Login
						</Link>
						<Link
							href="/auth/register"
							className="px-3 py-1.5 text-xs bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors"
						>
							Register
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<motion.section
				className="h-screen flex items-center pt-20 relative z-20"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1 }}
			>
				<div className="container mx-auto px-8">
					<div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className={`text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-secondary to-secondary/50 text-transparent bg-clip-text ${sixty_four.className}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              KOE Insights Lab
            </motion.h1>

						<motion.p
							className="text-base text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.4 }}
						>
							The University of Cyprus Economics Research Centre&apos;s central repository for time‑series economic indicators
						</motion.p>

						<motion.div
							className="flex justify-center space-x-4 mb-12"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.6 }}
						>
							<Link
								href="/auth/register"
								className="px-8 py-3 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors font-medium"
							>
								Get Started
							</Link>
							<Link
								href="/auth/login"
								className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted transition-colors font-medium"
							>
								Sign In
							</Link>
						</motion.div>

						{/* Feature preview hint */}
						<motion.div
							className="text-center space-y-4 mb-16 sm:mb-0"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.8 }}
						>
							<p className="text-xs text-muted-foreground/80 uppercase tracking-wider">
								Discover Features
							</p>
							<div className="flex justify-center space-x-6">
								{[
									contentSections.find(s => s.id === 'workflows'),
									contentSections.find(s => s.id === 'tables'),
									contentSections.find(s => s.id === 'indicators'),
									contentSections.find(s => s.id === 'collaboration')
								].filter(Boolean).map((section, i) => {
									const Icon = section!.icon;
									const sectionIndex = contentSections.findIndex(s => s.id === section!.id);

									const scrollToSection = () => {
										const scrollDistance = window.innerHeight * (sectionIndex + 1);
										window.scrollTo({
											top: scrollDistance,
											behavior: 'smooth'
										});
									};

									return (
										<motion.div
											key={section!.id}
											className="flex flex-col items-center space-y-2 cursor-pointer group"
											initial={{ y: 10, opacity: 0 }}
											animate={{ y: 0, opacity: 1 }}
											transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
											onClick={scrollToSection}
										>
											<div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
												<Icon className="w-4 h-4 text-secondary" />
											</div>
											<span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">{section!.title}</span>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					</div>
				</div>

				{/* Scroll indicator */}
				<motion.div
					className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1, delay: 1.5 }}
				>
					<p className="text-xs text-muted-foreground/60 uppercase tracking-wider">Scroll to explore</p>
					<motion.div
						className="w-6 h-10 border border-muted-foreground/30 rounded-full flex justify-center"
						animate={{ y: [0, 5, 0] }}
						transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
					>
						<div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"></div>
					</motion.div>
				</motion.div>
			</motion.section>

			{/* Scrolling Content Sections */}
			<ScrollingContent />

			{/* Footer CTA */}
			<motion.section
				className="h-screen flex items-center justify-center bg-muted/20"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ duration: 1 }}
				viewport={{ once: true }}
			>
				<div className="text-center max-w-2xl mx-auto px-8">
					<div className="mb-6 flex justify-center">
						<div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-lg">
							<PlayCircle className="w-8 h-8 text-white" />
						</div>
					</div>

					<h2 className="text-2xl font-semibold mb-6 text-foreground">
						Ready to get started?
					</h2>
					<p className="text-base text-muted-foreground mb-8">
						Join the Economics Research Centre&apos;s data platform today.
					</p>
					<div className="flex justify-center space-x-4">
						<Link
							href="/auth/register"
							className="px-8 py-3 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-colors font-medium"
						>
							Create Account
						</Link>
						<Link
							href="/privacy"
							className="px-8 py-3 text-muted-foreground hover:text-foreground transition-colors font-medium underline underline-offset-4"
						>
							Privacy Policy
						</Link>
					</div>
				</div>
			</motion.section>
		</div>
	);
}
