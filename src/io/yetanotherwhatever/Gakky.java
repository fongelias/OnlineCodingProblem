package io.yetanotherwhatever;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;

/**
 * Created by achang on 8/15/2017.
 */
public class Gakky {


    public static void main(String[] args)
    {
        try (Stream<String> stream = Files.lines(Paths.get(args[0]))) {
            stream.map(s->gakkify(s)).forEach(s -> System.out.println((s)));

        } catch (IOException ioe)
        {

        }
    }

    private static String gakkify(String in, boolean retry)
    {
        //get unique chars
        Set uniques = getUniqueChars(in);

        //for each pair, see if removing everything else forms a gakki
        ArrayList<String> pairs = getTwoLetterCombos(uniques);


        for (int i = 0; i < pairs.size(); i++)
        {
            Set otherChars = new HashSet();
            otherChars.addAll(uniques);

            otherChars.remove(pairs.get(i).charAt(0));
            otherChars.remove(pairs.get(i).charAt(1));

            String possibleGakki = removeChars(in, otherChars);

            if (isGakky(possibleGakki))
            {
                return possibleGakki;
            }
        }

        return "";
    }


    protected static String gakkify(String in)
    {
        return gakkify(in, false);
    }

    static protected String removeChars(String in, Set toRemove)
    {
        String regex = "";

        Iterator iter = toRemove.iterator();
        while(iter.hasNext())
        {
            Object o = iter.next();
            regex += "\\Q" + o + "\\E*";
        }

        String filtered = in.replaceAll(regex, "");

        return filtered;
    }

    static protected boolean isGakky(String possibleGakki)
    {
        //is this a gakki?
        boolean isGakky = true;

        if(possibleGakki.length() < 4)
        {
            return false;
        }

        for (int k = 0; k < possibleGakki.length(); k++)
        {
            if (k%2 == 0 && possibleGakki.charAt(k) != possibleGakki.charAt(0))
            {
                isGakky = false;
                break;
            }
            else if (k%2 == 1 && possibleGakki.charAt(k) != possibleGakki.charAt(1))
            {
                isGakky = false;
                break;
            }
        }

        return isGakky;
    }

    static protected Set getUniqueChars(String in)
    {
        HashSet<Character> hs = new HashSet<>();

        for (int i = 0; i < in.length(); i++)
        {
            char c =in.charAt(i);
            hs.add(new Character(c));
        }

        return hs;
    }

    static protected ArrayList<String> getTwoLetterCombos(Set uniques)
    {
        Object[] arr = uniques.toArray();
        ArrayList<String> out = new ArrayList();
        for (int i = 0; i < uniques.size() -1; i++)
        {
            for (int j = i+1; j < uniques.size(); j++)
            {
                out.add("" + arr[i] + arr[j]);
            }
        }

        return out;
    }

}
