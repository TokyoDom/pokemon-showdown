import { DraftPhase } from "../room-battle";

export const commands: Chat.ChatCommands = {
    draft(target, room, user, connection, cmd, message) {
        const args = target.split(',');
        if(!room) return this.sendReply('Not in a room.');

        if (!room.battle || room.battle.format !== 'gen9draftmode') return this.sendReply("This command is only for Draft Mode.");
    
        const draftState = room.battle.draftState;
        if (!draftState) return this.sendReply('No draft found for this game');
        if (draftState.phase === DraftPhase.End) return this.sendReply('Drafting is over!')

        if (room.p1?.id === user.id && draftState.turn === "p1") {
            if (draftState.bans.has(target)) return this.sendReply(`${target} is already banned!`);
            if (draftState.p1Picks.has(target)) return this.sendReply(`You have already picked ${target}!`);
            if (draftState.p2Picks.has(target)) return this.sendReply(`Your opponent has already picked ${target}!`);

            if (draftState.phase === DraftPhase.FirstBans || draftState.phase === DraftPhase.SecondBans) {                                 
                draftState.bans.add(target);
                draftState.turn = "p2";
                return this.add(`${user.name} has banned ${target}`);
            }

            if (draftState.phase === DraftPhase.FirstPicks || draftState.phase === DraftPhase.SecondPicks) {                                 
                draftState.p1Picks.add(target);
                draftState.turn = "p2";
                return this.add(`${user.name} has picked ${target}`);              
            }
        }

        if (room.p2?.id === user.id && draftState.turn === "p2") {
            if (draftState.bans.has(target)) return this.sendReply(`${target} is already banned!`);
            if (draftState.p1Picks.has(target)) return this.sendReply(`Your opponent has already picked ${target}!`);
            if (draftState.p2Picks.has(target)) return this.sendReply(`You have already picked ${target}!`);

            if (draftState.phase === DraftPhase.FirstBans || draftState.phase === DraftPhase.SecondBans) {                                 
                draftState.bans.add(target);
                if (draftState.bans.size === 4) draftState.phase = DraftPhase.FirstPicks;
                if (draftState.bans.size === 8) draftState.phase = DraftPhase.SecondPicks;
                draftState.turn = "p1";
                return this.add(`${user.name} has banned ${target}`);
            }

            if (draftState.phase === DraftPhase.FirstPicks || draftState.phase === DraftPhase.SecondPicks) {                                 
                draftState.p2Picks.add(target);
                this.add(`${user.name} has picked ${target}`);
                draftState.turn = "p1";  

                if (draftState.p1Picks.size === 3 && draftState.p2Picks.size === 3) {
                    draftState.phase = DraftPhase.SecondBans;  
                }

                if (draftState.p1Picks.size === 6 && draftState.p2Picks.size === 6) {
                    draftState.phase = DraftPhase.End;
                    room.battle.endDraftPhase(user.id); // hacky...
                }
            }
        }
    }
}