"use client"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, MessageCircle, AlertCircle, NavigationIcon } from "lucide-react"
import { useState } from "react"

export default function SupportPage() {
  const [resources] = useState([
    { title: "National Crisis Hotline", number: "988", description: "Free 24/7 support for mental health" },
    { title: "International Support", number: "+1-800-SUICIDE", description: "Crisis support across borders" },
    { title: "Campus Counseling", number: "(555) 123-4567", description: "Connect with your school counselor" },
  ])

  return (
    <Layout 
      title="Mental Health & Support" 
      subtitle="Access resources and get help when you need it"
    >
      {/* Alert Banner */}
      <div className="mb-12 p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-4">
        <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-slate-100 mb-2">You're Not Alone</h2>
          <p className="text-slate-400">If you're struggling, please reach out. Support is available 24/7.</p>
        </div>
      </div>

      <div className="mb-12">
        <p className="text-slate-400">Resources and help when you need it most</p>
      </div>

        {/* Hotlines */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-100 mb-6">Emergency Resources</h2>
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-100">{resource.title}</h3>
                  <a href={`tel:${resource.number}`} className="text-blue-500 font-bold hover:text-blue-400">
                    {resource.number}
                  </a>
                </div>
                <p className="text-slate-400 mb-4">{resource.description}</p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Other Resources */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
            <MessageCircle className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Chat Support</h3>
            <p className="text-slate-400 mb-4">Talk to trained counselors online</p>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              Start Chat
            </Button>
          </div>
          <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
            <MapPin className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Find Nearby Help</h3>
            <p className="text-slate-400 mb-4">Locate counselors near you</p>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              <NavigationIcon className="w-4 h-4 mr-2" />
              Find Services
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="p-6 rounded-lg bg-slate-700/50">
          <h3 className="font-semibold text-slate-100 mb-3">Why StudyPal Offers Support</h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>• Mental health is as important as your studies</li>
            <li>• Academic stress can impact your wellbeing</li>
            <li>• Professional support makes a real difference</li>
            <li>• You deserve to prioritize your mental health</li>
          </ul>
        </div>
    </Layout>
  )
}
