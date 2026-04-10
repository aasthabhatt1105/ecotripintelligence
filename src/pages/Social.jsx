import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Users, MessageSquare, Plus, Send, ArrowLeft, Tag, Search, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DISCOUNT_THRESHOLD = 5;

export default function Social() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("groups"); // groups | chat | newGroup
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDest, setNewGroupDest] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      const [users, allGroups] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Group.list(),
      ]);
      setAllUsers(users.filter((u) => u.email !== me.email));
      // Show groups where user is a member or creator
      setGroups(allGroups.filter((g) => {
        const members = JSON.parse(g.member_emails || "[]");
        return g.creator_email === me.email || members.includes(me.email);
      }));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (group) => {
    setActiveGroup(group);
    setView("chat");
    const msgs = await base44.entities.Message.filter({ group_id: group.id }, "created_date", 100);
    setMessages(msgs);

    // Subscribe to new messages
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.group_id === group.id) {
        if (event.type === "create") setMessages((p) => [...p, event.data]);
      }
    });
    return unsub;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    setSending(true);
    await base44.entities.Message.create({
      group_id: activeGroup.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: msgInput.trim(),
      message_type: "text",
    });
    setMsgInput("");
    setSending(false);
    // Refresh
    const msgs = await base44.entities.Message.filter({ group_id: activeGroup.id }, "created_date", 100);
    setMessages(msgs);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    const memberEmails = [user.email, ...selectedMembers];
    const group = await base44.entities.Group.create({
      name: newGroupName,
      destination: newGroupDest,
      creator_email: user.email,
      member_emails: JSON.stringify(memberEmails),
      member_count: memberEmails.length,
      discount_unlocked: memberEmails.length >= DISCOUNT_THRESHOLD,
    });
    // System message
    await base44.entities.Message.create({
      group_id: group.id,
      sender_email: "system",
      sender_name: "EcoTrip",
      content: `Group "${newGroupName}" created! ${memberEmails.length >= DISCOUNT_THRESHOLD ? "🎉 Group discount unlocked!" : `Add ${DISCOUNT_THRESHOLD - memberEmails.length} more members to unlock group discount!`}`,
      message_type: "system",
    });
    const updated = [...groups, group];
    setGroups(updated);
    setNewGroupName("");
    setNewGroupDest("");
    setSelectedMembers([]);
    setCreating(false);
    openChat(group);
  };

  const toggleMember = (email) => {
    setSelectedMembers((p) => p.includes(email) ? p.filter((e) => e !== email) : [...p, email]);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ─── CHAT VIEW ───────────────────────────────────────────────────────────────
  if (view === "chat" && activeGroup) {
    const members = JSON.parse(activeGroup.member_emails || "[]");
    const discountUnlocked = members.length >= DISCOUNT_THRESHOLD;
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView("groups")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-base">{activeGroup.name}</h2>
            <p className="text-xs text-muted-foreground">{members.length} members{activeGroup.destination ? ` · ✈️ ${activeGroup.destination}` : ""}</p>
          </div>
          {discountUnlocked && (
            <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-xl text-xs font-bold">
              <Tag className="w-3.5 h-3.5" /> 10% OFF
            </div>
          )}
        </div>

        {/* Discount Banner */}
        {discountUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-3 text-sm font-medium text-center"
          >
            🎉 Group discount unlocked! Get <strong>10% off</strong> travel tickets when booking together.
          </motion.div>
        )}
        {!discountUnlocked && (
          <div className="mb-3 bg-muted/50 rounded-2xl p-2.5 text-xs text-muted-foreground text-center">
            Add {DISCOUNT_THRESHOLD - members.length} more member{DISCOUNT_THRESHOLD - members.length > 1 ? "s" : ""} to unlock group discount 🎟️
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((msg, i) => {
            const isMe = msg.sender_email === user.email;
            const isSystem = msg.message_type === "system";
            if (isSystem) return (
              <div key={i} className="text-center text-[11px] text-muted-foreground bg-muted/40 rounded-xl px-3 py-1.5 mx-auto max-w-xs">
                {msg.content}
              </div>
            );
            return (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {msg.sender_name?.[0] || "?"}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.sender_name}</span>}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border/50 rounded-bl-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2 pt-3">
          <Input
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder="Type a message..."
            className="rounded-2xl h-11 bg-card border-border/50"
          />
          <Button type="submit" disabled={!msgInput.trim() || sending} className="rounded-2xl h-11 w-11 shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    );
  }

  // ─── NEW GROUP VIEW ───────────────────────────────────────────────────────────
  if (view === "newGroup") {
    const totalMembers = 1 + selectedMembers.length;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("groups")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-bold text-lg">Create Group</h2>
        </div>

        <div className="space-y-3">
          <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name (e.g. Tokyo Trip 🇯🇵)" className="rounded-2xl h-12" />
          <Input value={newGroupDest} onChange={(e) => setNewGroupDest(e.target.value)} placeholder="Destination (optional)" className="rounded-2xl h-12" />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Add Members</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-9 rounded-2xl h-10" />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => toggleMember(u.email)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${selectedMembers.includes(u.email) ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:bg-muted/30"}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {u.full_name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                {selectedMembers.includes(u.email) && <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Discount preview */}
        <div className={`rounded-2xl p-3 text-sm text-center font-medium transition-all ${totalMembers >= DISCOUNT_THRESHOLD ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
          {totalMembers >= DISCOUNT_THRESHOLD
            ? `🎉 ${totalMembers} members — Group discount will be unlocked!`
            : `👥 ${totalMembers}/${DISCOUNT_THRESHOLD} members — Add ${DISCOUNT_THRESHOLD - totalMembers} more to unlock discount`}
        </div>

        <Button onClick={createGroup} disabled={!newGroupName.trim() || creating} className="w-full h-12 rounded-2xl">
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create Group
        </Button>
      </div>
    );
  }

  // ─── GROUPS LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Connect & travel together</p>
        </div>
        <Button onClick={() => setView("newGroup")} className="rounded-2xl gap-2">
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      {/* Groups */}
      <div>
        <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Your Groups</h2>
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-border/50">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No groups yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a group to plan trips together!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const members = JSON.parse(group.member_emails || "[]");
              const discountUnlocked = members.length >= DISCOUNT_THRESHOLD;
              return (
                <motion.button
                  key={group.id}
                  onClick={() => openChat(group)}
                  whileHover={{ scale: 1.01 }}
                  className="w-full text-left bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{group.name}</span>
                      {discountUnlocked && (
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> 10% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {members.length} member{members.length > 1 ? "s" : ""}
                      {group.destination ? ` · ✈️ ${group.destination}` : ""}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* People on the app */}
      <div>
        <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Eco Travelers</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search travelers..." className="pl-9 rounded-2xl h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredUsers.slice(0, 8).map((u) => (
            <div key={u.email} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {u.full_name?.[0] || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{u.full_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}